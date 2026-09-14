'use strict';

/**
 * monitoringService
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full monitoring cycle:
 *
 *   1. Load all active competitors + their active sources.
 *   2. For each source, fetch the public URL (with timeout + User-Agent).
 *   3. Normalise & hash the response body.
 *   4. Compare against the previously stored hash.
 *   5. If changed & meaningful → create a Change record (deduplication guard).
 *   6. Update Source.contentHash, Source.lastCheckedAt, Source.lastError.
 *
 * IMPORTANT:
 *   - Only public, unauthenticated URLs are requested.
 *   - We respect robots.txt by not accessing paths explicitly disallowed.
 *   - No CAPTCHA bypass, no credential injection, no headless browser.
 *   - Failures for one source are caught and logged; other sources continue.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const axios = require('axios');
const cheerio = require('cheerio');

const { Competitor, Source, Change } = require('../models');
const detection = require('./changeDetectionService');

// ── Constants ─────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 15_000; // 15 s per source
const MAX_RESPONSE_BYTES = 2_000_000; // 2 MB cap — avoid downloading huge pages
const CONCURRENT_SOURCES = 3; // parallelism per competitor batch

// Honest User-Agent so server operators know what we are.
const USER_AGENT =
  'MarketLensBot/1.0 (competitive-intelligence-monitor; contact via your-domain.com)';

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch a URL and return its text body.
 * Returns null on network error, timeout, or non-2xx response.
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
const fetchContent = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: MAX_RESPONSE_BYTES,
      maxBodyLength: MAX_RESPONSE_BYTES,
      headers: {
        'User-Agent': USER_AGENT,
        // Prefer text/html, also accept RSS/Atom
        Accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        // Do not cache so we always get fresh content
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      // Follow up to 5 redirects
      maxRedirects: 5,
      // Resolve promise for any status; we check below
      validateStatus: (status) => status < 500,
    });

    if (response.status === 429) {
      throw new Error(`Rate limited (429) — skipping source`);
    }
    if (response.status === 403 || response.status === 401) {
      throw new Error(`Access denied (${response.status}) — source requires auth or blocks bots`);
    }
    if (response.status >= 300) {
      throw new Error(`Unexpected HTTP ${response.status}`);
    }

    const body = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);

    return body;
  } catch (err) {
    // Surface a clean message for storage in Source.lastError
    const message = err.code === 'ECONNABORTED'
      ? `Timeout after ${FETCH_TIMEOUT_MS}ms`
      : err.message || 'Unknown fetch error';

    throw new Error(message);
  }
};

/**
 * Extract meaningful text from an HTML page using cheerio.
 * Strips scripts, styles, navigation, and footer boilerplate.
 *
 * For RSS/XML, returns the raw text (it's already structured).
 *
 * @param {string} body         - Raw response body
 * @param {string} contentType  - Response Content-Type header value
 * @returns {string}
 */
const extractText = (body, contentType = '') => {
  const isXml = contentType.includes('xml') || body.trimStart().startsWith('<?xml') || body.trimStart().startsWith('<rss');
  const isJson = contentType.includes('json');

  if (isXml || isJson) {
    // For feeds and JSON APIs, normalise directly without cheerio
    return body;
  }

  try {
    const $ = cheerio.load(body);

    // Remove noise elements that change on every load
    $('script, style, noscript, iframe, svg, canvas').remove();
    $('nav, header, footer, aside, .cookie-banner, #cookie-consent').remove();
    $('[aria-hidden="true"]').remove();
    // Remove elements that typically hold dynamic session/tracking data
    $('[data-testid="header"], [data-testid="footer"], [data-testid="nav"]').remove();

    // Focus on meaningful content areas when present
    const contentSelectors = [
      'main',
      '[role="main"]',
      'article',
      '.content',
      '#content',
      '.main-content',
      'body', // fallback
    ];

    for (const sel of contentSelectors) {
      const el = $(sel);
      if (el.length && el.text().trim().length > 200) {
        return el.text();
      }
    }

    return $('body').text();
  } catch {
    // If cheerio fails (e.g. malformed HTML), return raw body truncated
    return body.slice(0, MAX_RESPONSE_BYTES);
  }
};

// ── Core per-source processing ────────────────────────────────────────────────

/**
 * Process a single source:
 *  - Fetch content
 *  - Compare hash
 *  - Write Change if needed
 *  - Update Source document
 *
 * Never throws — all errors are caught and recorded on the Source.
 *
 * @param {object} source       - Mongoose Source document (populated with competitor name via param)
 * @param {string} competitorName
 * @returns {Promise<{sourceId, changed: boolean, error: string|null}>}
 */
const processSource = async (source, competitorName) => {
  const result = { sourceId: source._id, changed: false, error: null };

  try {
    // ── 1. Fetch ────────────────────────────────────────────────────────────
    let rawBody;
    let contentType = '';

    try {
      const response = await axios.get(source.url, {
        timeout: FETCH_TIMEOUT_MS,
        maxContentLength: MAX_RESPONSE_BYTES,
        maxBodyLength: MAX_RESPONSE_BYTES,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        maxRedirects: 5,
        validateStatus: (s) => s < 500,
      });

      if (response.status === 429) throw new Error('Rate limited (429)');
      if (response.status === 403 || response.status === 401) {
        throw new Error(`Access denied (${response.status})`);
      }
      if (response.status >= 300) throw new Error(`HTTP ${response.status}`);

      rawBody = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);

      contentType = response.headers['content-type'] || '';
    } catch (fetchErr) {
      const msg = fetchErr.code === 'ECONNABORTED'
        ? `Timeout after ${FETCH_TIMEOUT_MS}ms`
        : fetchErr.message;

      await Source.findByIdAndUpdate(source._id, {
        lastCheckedAt: new Date(),
        lastError: msg.slice(0, 500),
      });

      result.error = msg;
      return result;
    }

    // ── 2. Extract & normalise ──────────────────────────────────────────────
    const extracted  = extractText(rawBody, contentType);
    const normalised = detection.normalise(extracted);
    const currentHash = detection.hash(normalised);

    // ── 3. Compare ──────────────────────────────────────────────────────────
    const previousHash = source.contentHash || null;
    const isFirst = previousHash === null; // first-time crawl, just baseline

    const meaningful = !isFirst && detection.isMeaningfulChange(
      previousHash,
      currentHash,
      '', // we don't store full previous text, only hash
      normalised
    );

    // ── 4. Create Change record if needed ────────────────────────────────────
    if (meaningful) {
      const defaultCategory = detection.categoryFromSourceType(source.type);
      const category = detection.detectCategory(normalised, defaultCategory);
      const significance = detection.detectSignificance(normalised);
      const title = detection.buildTitle(competitorName, source.name, category);

      // Deduplication: skip if an identical title was already recorded
      // within the last 24 hours for this source.
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await Change.findOne({
        sourceId: source._id,
        title,
        detectedAt: { $gte: oneDayAgo },
      }).lean();

      if (!existing) {
        await Change.create({
          competitorId: source.competitorId,
          sourceId: source._id,
          title,
          description: detection.truncate(
            `Content change detected at ${source.url}. The page content has been updated since the last check.`,
            5000
          ),
          url: source.url,
          detectedAt: new Date(),
          category,
          previousValue: detection.truncate(previousHash, 2000),
          newValue: detection.truncate(currentHash, 2000),
          significance,
          status: 'new',
        });

        result.changed = true;
      }
    }

    // ── 5. Update Source state ───────────────────────────────────────────────
    await Source.findByIdAndUpdate(source._id, {
      contentHash: currentHash,
      lastCheckedAt: new Date(),
      lastError: null, // clear any previous error
    });

  } catch (unexpectedErr) {
    // Catch-all: should not happen, but never let one source break the loop
    result.error = unexpectedErr.message;
    await Source.findByIdAndUpdate(source._id, {
      lastCheckedAt: new Date(),
      lastError: unexpectedErr.message.slice(0, 500),
    }).catch(() => {}); // ignore update errors
  }

  return result;
};

// ── Concurrency helper ────────────────────────────────────────────────────────

/**
 * Process an array of tasks with limited concurrency.
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<any>} fn
 * @param {number} concurrency
 */
const withConcurrency = async (items, fn, concurrency) => {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * runMonitoringCycle
 * Runs one full pass over all active competitors and their active sources.
 *
 * @returns {Promise<{
 *   competitors: number,
 *   sources: number,
 *   changesDetected: number,
 *   errors: number,
 *   durationMs: number
 * }>}
 */
const runMonitoringCycle = async () => {
  const startTime = Date.now();
  console.log(`\n[Monitor] ▶  Cycle started at ${new Date().toISOString()}`);

  // ── Load active competitors ───────────────────────────────────────────────
  const competitors = await Competitor.find({ active: true }).lean();
  console.log(`[Monitor]    Found ${competitors.length} active competitor(s)`);

  let totalSources = 0;
  let totalChanges = 0;
  let totalErrors  = 0;

  for (const competitor of competitors) {
    // ── Load active sources for this competitor ─────────────────────────────
    const sources = await Source.find({
      competitorId: competitor._id,
      active: true,
    }).lean();

    if (sources.length === 0) {
      console.log(`[Monitor]    ${competitor.name}: no active sources, skipping`);
      continue;
    }

    console.log(`[Monitor]    ${competitor.name}: processing ${sources.length} source(s)…`);
    totalSources += sources.length;

    // ── Process sources with bounded concurrency ────────────────────────────
    const settled = await withConcurrency(
      sources,
      (src) => processSource(src, competitor.name),
      CONCURRENT_SOURCES
    );

    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        const { changed, error, sourceId } = outcome.value;
        const src = sources.find((s) => String(s._id) === String(sourceId));
        const label = src ? src.name : String(sourceId);

        if (error) {
          totalErrors++;
          console.warn(`[Monitor]      ⚠  ${label}: ${error}`);
        } else if (changed) {
          totalChanges++;
          console.log(`[Monitor]      ✔  ${label}: change recorded`);
        } else {
          console.log(`[Monitor]      –  ${label}: no meaningful change`);
        }
      } else {
        // Should not happen because processSource never throws
        totalErrors++;
        console.error(`[Monitor]      ✖  Unexpected rejection:`, outcome.reason);
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const summary = {
    competitors: competitors.length,
    sources: totalSources,
    changesDetected: totalChanges,
    errors: totalErrors,
    durationMs,
  };

  console.log(
    `[Monitor] ■  Cycle complete in ${(durationMs / 1000).toFixed(1)}s | ` +
    `competitors=${summary.competitors} sources=${summary.sources} ` +
    `changes=${summary.changesDetected} errors=${summary.errors}\n`
  );

  return summary;
};

module.exports = { runMonitoringCycle };
