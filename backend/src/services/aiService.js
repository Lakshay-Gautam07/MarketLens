'use strict';

/**
 * aiService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates strategic AI analysis for a Change document using Gemini.
 *
 * Public API:
 *   analyseChange(changeId)  → Promise<AIInsight document>
 *
 * Rules:
 *   - GEMINI_API_KEY is read exclusively from process.env / config; never
 *     returned to callers or logged.
 *   - If an AIInsight already exists for the Change, it is returned as-is
 *     (idempotent — no wasted API calls).
 *   - All Gemini/network errors are wrapped into typed AppErrors so the
 *     Express error handler can surface them correctly.
 *   - The raw API response is validated before saving; malformed JSON from
 *     the model is handled gracefully.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { GoogleGenAI } = require('@google/genai');
const config          = require('../config');
const { Change, AIInsight, Competitor, Source } = require('../models');

// ── Gemini client (lazy-initialised so tests can mock before require) ─────────
let _genai = null;
const getClient = () => {
  if (_genai) return _genai;

  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.statusCode = 503;
    throw err;
  }

  _genai  = new GoogleGenAI({ apiKey });
  return _genai;
};

// ── Model to use ──────────────────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * Build a structured prompt that instructs Gemini to return ONLY valid JSON.
 *
 * @param {object} change      - Lean Change document
 * @param {string} competitorName
 * @param {string} sourceName
 * @param {string} sourceType
 * @returns {string}
 */
const buildPrompt = (change, competitorName, sourceName, sourceType) => `
You are a senior competitive intelligence analyst at a B2B SaaS company.

Analyse the following competitor change and provide a structured strategic assessment.

## Competitor Change Details
- Competitor   : ${competitorName}
- Source       : ${sourceName} (${sourceType})
- Source URL   : ${change.url || 'N/A'}
- Change title : ${change.title}
- Category     : ${change.category}
- Significance : ${change.significance}
- Detected at  : ${new Date(change.detectedAt).toUTCString()}
- Description  : ${change.description || 'No description available'}

## Instructions
Return ONLY a valid JSON object with exactly these fields (no markdown, no code fences):

{
  "summary": "2–4 sentence plain-English summary of the change and why it matters",
  "strategicImpact": "How this change affects the competitive landscape and our market position",
  "competitorAdvantage": "What advantage the competitor gains from this change",
  "recommendedAction": "Specific, actionable response our team should consider",
  "affectedSegment": "Customer or market segment most affected (e.g. SMB, Enterprise, Developers)",
  "confidence": 0.0
}

Rules:
- confidence must be a number between 0.0 (low) and 1.0 (high) reflecting how certain you are given the available information.
- All string fields must be concise (under 400 characters each).
- Do not include any explanation outside the JSON object.
- Do not wrap the JSON in markdown code fences.
`.trim();

// ── Response parser / validator ───────────────────────────────────────────────

/**
 * Parse and validate the raw text response from Gemini.
 * Strips markdown fences if the model ignores instructions.
 *
 * @param {string} rawText
 * @returns {{ summary, strategicImpact, competitorAdvantage, recommendedAction, affectedSegment, confidence }}
 * @throws {Error} if the response cannot be parsed or is missing required fields
 */
const parseGeminiResponse = (rawText) => {
  // Strip markdown code fences if present (```json … ```)
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw Object.assign(
      new Error(`Gemini returned non-JSON content: ${text.slice(0, 200)}`),
      { statusCode: 502 }
    );
  }

  const REQUIRED = [
    'summary',
    'strategicImpact',
    'competitorAdvantage',
    'recommendedAction',
    'affectedSegment',
    'confidence',
  ];

  const missing = REQUIRED.filter((k) => parsed[k] === undefined || parsed[k] === null);
  if (missing.length > 0) {
    throw Object.assign(
      new Error(`Gemini response missing required fields: ${missing.join(', ')}`),
      { statusCode: 502 }
    );
  }

  // Coerce and clamp confidence to [0, 1]
  const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));

  // Truncate fields to schema maxlength to avoid Mongoose validation errors
  const truncate = (str, max) =>
    typeof str === 'string' ? str.slice(0, max) : String(str).slice(0, max);

  return {
    summary:             truncate(parsed.summary, 2000),
    strategicImpact:     truncate(parsed.strategicImpact, 2000),
    competitorAdvantage: truncate(parsed.competitorAdvantage, 2000),
    recommendedAction:   truncate(parsed.recommendedAction, 2000),
    affectedSegment:     truncate(parsed.affectedSegment, 500),
    confidence,
  };
};

// ── Core service ──────────────────────────────────────────────────────────────

/**
 * analyseChange
 * Generates an AIInsight for the given Change ID.
 * Idempotent — returns the existing insight without calling Gemini again if
 * one already exists for this Change.
 *
 * @param {string|mongoose.Types.ObjectId} changeId
 * @returns {Promise<import('mongoose').Document>} The saved AIInsight document
 * @throws Typed Error with statusCode:
 *   404 – Change not found
 *   409 – Insight already exists (returns existing instead, no throw)
 *   503 – GEMINI_API_KEY not configured
 *   502 – Gemini API returned an unusable response
 *   500 – Unexpected error
 */
const analyseChange = async (changeId) => {
  // ── 1. Load existing insight (idempotency) ────────────────────────────────
  const existing = await AIInsight.findOne({ changeId }).lean();
  if (existing) {
    return existing;
  }

  // ── 2. Load the Change with populated refs ────────────────────────────────
  const change = await Change.findById(changeId)
    .populate('competitorId', 'name category description')
    .populate('sourceId', 'name type url')
    .lean();

  if (!change) {
    const err = new Error(`Change not found: ${changeId}`);
    err.statusCode = 404;
    throw err;
  }

  const competitorName = change.competitorId?.name  || 'Unknown Competitor';
  const sourceName     = change.sourceId?.name      || 'Unknown Source';
  const sourceType     = change.sourceId?.type      || 'other';

  // ── 3. Build prompt ───────────────────────────────────────────────────────
  const prompt = buildPrompt(change, competitorName, sourceName, sourceType);

  // ── 4. Call Gemini API ────────────────────────────────────────────────────
  let rawText;
  try {
    const genai  = getClient();
    const model  = genai.models;
    const result = await model.generateContent({
      model:    GEMINI_MODEL,
      contents: prompt,
    });

    rawText = result.text;

    if (!rawText || rawText.trim() === '') {
      throw Object.assign(
        new Error('Gemini returned an empty response'),
        { statusCode: 502 }
      );
    }
  } catch (apiErr) {
    // Don't expose the API key in error messages
    const safeMessage = apiErr.message
      ? apiErr.message.replace(config.gemini.apiKey || '', '[REDACTED]')
      : 'Gemini API call failed';

    const err = new Error(`Gemini API error: ${safeMessage}`);
    err.statusCode = apiErr.statusCode || 502;
    throw err;
  }

  // ── 5. Parse & validate response ─────────────────────────────────────────
  const analysisData = parseGeminiResponse(rawText);

  // ── 6. Persist AIInsight ──────────────────────────────────────────────────
  // Use findOneAndUpdate with upsert to handle the edge case where two
  // concurrent requests race to create the same insight.
  const insight = await AIInsight.findOneAndUpdate(
    { changeId },
    {
      $setOnInsert: {
        changeId,
        ...analysisData,
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // ── 7. Mark the Change as reviewed ───────────────────────────────────────
  await Change.findByIdAndUpdate(changeId, { status: 'reviewed' });

  return insight;
};

module.exports = { analyseChange };
