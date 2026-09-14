'use strict';

const crypto = require('crypto');

/**
 * changeDetectionService
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure, stateless helpers that:
 *   1. Normalise raw fetched content into a stable, comparable string.
 *   2. Hash that string so we can cheaply compare old vs new.
 *   3. Decide whether a detected diff is "meaningful" (not just noise).
 *   4. Classify changes and assign a significance level.
 *   5. Extract a human-readable title/description from the diff.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Noise patterns to strip before comparison ─────────────────────────────────
// Things that change on every page load but carry no informational signal.
const NOISE_PATTERNS = [
  // Cache-busted asset fingerprints  e.g. main.abc123.js
  /\b[a-f0-9]{8,}\b/g,
  // ISO timestamps / Last-Modified dates
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g,
  // Unix timestamps (10-13 digit numbers)
  /\b\d{10,13}\b/g,
  // CSRF / nonce tokens (base64-ish 20+ char strings)
  /[A-Za-z0-9+/=]{20,}/g,
  // Inline Google Analytics / GTM snippets
  /gtag\([^)]*\)/g,
  /ga\('[^']*'[^)]*\)/g,
  // Whitespace normalisation (done separately below)
];

// ── Category keywords ─────────────────────────────────────────────────────────
const CATEGORY_SIGNALS = {
  pricing: [
    'price', 'pricing', 'plan', 'tier', 'cost', '\$/mo', '\$/yr',
    'per seat', 'per user', 'enterprise', 'free trial', 'discount',
  ],
  product: [
    'feature', 'launch', 'release', 'new in', 'introducing', 'now available',
    'beta', 'roadmap', 'improvement', 'update', 'shipped',
  ],
  changelog: [
    'changelog', "what's new", 'release notes', 'version', 'v\\d',
    'bug fix', 'fixed', 'resolved', 'improved',
  ],
  blog: [
    'published', 'article', 'post', 'guide', 'how to', 'tutorial',
    'case study', 'deep dive',
  ],
  hiring: [
    'hiring', 'we\'re hiring', 'open roles', 'join our team',
    'job opening', 'careers', 'engineer wanted',
  ],
  marketing: [
    'campaign', 'webinar', 'event', 'conference', 'announcement',
    'press release', 'partnership', 'integration',
  ],
};

// ── Significance signals ──────────────────────────────────────────────────────
const SIGNIFICANCE_SIGNALS = {
  critical: ['acquired', 'acquisition', 'merger', 'raises', 'series', 'ipo', 'shut down', 'bankruptcy'],
  high:     ['new pricing', 'price increase', 'price cut', 'major release', 'enterprise plan', 'free plan', 'new feature'],
  low:      ['minor', 'typo', 'small fix', 'cosmetic', 'style update'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise content so trivial diffs (whitespace, timestamps, tokens)
 * don't trigger false-positive change detections.
 *
 * @param {string} raw  - Raw text/HTML content from the HTTP response
 * @returns {string}    - Normalised, comparable string
 */
const normalise = (raw) => {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;

  // Apply each noise pattern
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }

  // Collapse all whitespace (newlines, tabs, multiple spaces → single space)
  text = text.replace(/\s+/g, ' ').trim();

  // Lower-case so case-only changes don't trigger (navigation labels etc.)
  return text.toLowerCase();
};

/**
 * SHA-256 hash of normalised content.
 * Used to cheaply detect whether content has changed.
 *
 * @param {string} content - Already-normalised content
 * @returns {string}       - Hex digest
 */
const hash = (content) =>
  crypto.createHash('sha256').update(content, 'utf8').digest('hex');

/**
 * Compute hash of raw content in one step.
 *
 * @param {string} raw
 * @returns {string} hex digest
 */
const hashContent = (raw) => hash(normalise(raw));

/**
 * Determine whether the content difference is meaningful.
 *
 * Rules:
 *  - If hashes are identical → no change.
 *  - If the normalised content length changed by < MIN_DIFF_CHARS → ignore
 *    (catches single-word tweaks like date updates in footers).
 *  - Otherwise → meaningful change.
 *
 * @param {string} previousHash
 * @param {string} currentHash
 * @param {string} previousNormalised
 * @param {string} currentNormalised
 * @returns {boolean}
 */
const MIN_DIFF_CHARS = 80; // characters of net content change to care about

const isMeaningfulChange = (
  previousHash,
  currentHash,
  previousNormalised,
  currentNormalised
) => {
  if (previousHash === currentHash) return false;

  const lengthDiff = Math.abs(
    (currentNormalised || '').length - (previousNormalised || '').length
  );

  return lengthDiff >= MIN_DIFF_CHARS;
};

/**
 * Map a source type to its default Change category.
 *
 * @param {string} sourceType - Value from Source.type enum
 * @returns {string}          - Change.category enum value
 */
const categoryFromSourceType = (sourceType) => {
  const map = {
    pricing:   'pricing',
    changelog: 'changelog',
    blog:      'blog',
    rss:       'blog',
    social:    'marketing',
    github:    'product',
    website:   'product',
    other:     'other',
  };
  return map[sourceType] || 'other';
};

/**
 * Refine category by scanning the new content for keyword signals.
 * Overrides the source-type default when a stronger signal is found.
 *
 * @param {string} content    - Normalised content snippet
 * @param {string} defaultCat - Category from source type
 * @returns {string}
 */
const detectCategory = (content, defaultCat) => {
  const lower = (content || '').toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_SIGNALS)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return category;
      }
    }
  }

  return defaultCat;
};

/**
 * Rate the significance of a change by scanning content for strong signals.
 *
 * @param {string} content - Normalised content
 * @returns {'low'|'medium'|'high'|'critical'}
 */
const detectSignificance = (content) => {
  const lower = (content || '').toLowerCase();

  for (const [level, signals] of Object.entries(SIGNIFICANCE_SIGNALS)) {
    for (const signal of signals) {
      if (lower.includes(signal)) return level;
    }
  }

  return 'medium';
};

/**
 * Build a human-readable title for the Change record.
 *
 * @param {string} competitorName
 * @param {string} sourceName
 * @param {string} category
 * @returns {string} ≤ 250 chars
 */
const buildTitle = (competitorName, sourceName, category) => {
  const label =
    category.charAt(0).toUpperCase() + category.slice(1);
  return `${competitorName}: ${label} change detected on ${sourceName}`.slice(0, 250);
};

/**
 * Truncate a string to maxLen characters, appending '…' if cut.
 *
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
const truncate = (str, maxLen) => {
  if (!str) return '';
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…';
};

module.exports = {
  normalise,
  hash,
  hashContent,
  isMeaningfulChange,
  categoryFromSourceType,
  detectCategory,
  detectSignificance,
  buildTitle,
  truncate,
  MIN_DIFF_CHARS,
};
