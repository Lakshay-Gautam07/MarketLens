'use strict';

/**
 * reportService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates weekly competitive intelligence reports using Gemini AI.
 * Synthesizes changes and AI insights across tracked competitors for a
 * specified calendar week.
 *
 * Public API:
 *   generateWeeklyReport({ weekStart, weekEnd }) → Promise<WeeklyReport>
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { GoogleGenAI } = require('@google/genai');
const config          = require('../config');
const { Change, AIInsight, WeeklyReport, Competitor } = require('../models');

// ── Gemini client ─────────────────────────────────────────────────────────────
let _genai = null;
const getClient = () => {
  if (_genai) return _genai;

  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.statusCode = 503;
    throw err;
  }

  _genai = new GoogleGenAI({ apiKey });
  return _genai;
};

// ── Model to use ──────────────────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// ── Prompt builder ────────────────────────────────────────────────────────────
const buildReportPrompt = (changes, insightsByChangeId, weekStartStr, weekEndStr) => {
  const changeSummaries = changes
    .map((c, i) => {
      const compName = c.competitorId?.name || 'Unknown Competitor';
      const ins = insightsByChangeId[c._id.toString()];
      let insText = '';
      if (ins) {
        insText = ` | Strategic Impact: ${ins.strategicImpact} | Recommended Action: ${ins.recommendedAction}`;
      }
      return `${i + 1}. [${compName}] (${c.category} - ${c.significance} significance): ${c.title}. Details: ${c.description || 'N/A'}${insText}`;
    })
    .join('\n');

  return `
You are the Chief Competitive Intelligence Analyst at MarketLens.

Analyze the competitor changes and strategic insights recorded between ${weekStartStr} and ${weekEndStr}, then synthesize a comprehensive Weekly Competitive Intelligence Report.

## Competitor Changes Detected This Week:
${changeSummaries}

## Instructions:
Return ONLY a valid JSON object with exactly the following 3 fields (no markdown fences, no explanatory text outside the JSON):

{
  "keyChanges": [
    "Synthesized bullet point describing a significant competitor change",
    "Another notable competitor movement"
  ],
  "strategicSignals": [
    "Cross-competitor pattern, pricing direction, or industry vector",
    "Underlying market shift observed from these activities"
  ],
  "recommendations": [
    "Specific, actionable product or positioning recommendation for our team",
    "Tactical response to protect market share or exploit competitor gaps"
  ]
}

Rules:
- keyChanges: 3 to 6 concise, impact-focused summary bullet points.
- strategicSignals: 2 to 4 high-level strategic patterns observed across the movements.
- recommendations: 2 to 4 specific, actionable counter-strategies for product and go-to-market teams.
- Do not invent competitor activity or metrics not grounded in the data above.
- Return ONLY the JSON object.
`.trim();
};

// ── Response parser / validator ───────────────────────────────────────────────
const parseReportResponse = (rawText) => {
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw Object.assign(
      new Error(`Gemini returned non-JSON report content: ${text.slice(0, 200)}`),
      { statusCode: 502 }
    );
  }

  const cleanArray = (arr, fallback) => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map((item) => String(item).trim()).filter(Boolean);
    }
    return fallback;
  };

  return {
    keyChanges: cleanArray(parsed.keyChanges, ['No key competitor movements identified for this period.']),
    strategicSignals: cleanArray(parsed.strategicSignals, ['No major strategic shifts detected in the current window.']),
    recommendations: cleanArray(parsed.recommendations, ['Continue monitoring competitor channels for emerging signals.']),
  };
};

/**
 * generateWeeklyReport
 * @param {Object} options
 * @param {Date|string} options.weekStart
 * @param {Date|string} [options.weekEnd]
 * @returns {Promise<WeeklyReport>}
 */
const generateWeeklyReport = async ({ weekStart, weekEnd }) => {
  if (!weekStart) {
    const err = new Error('weekStart is required');
    err.statusCode = 400;
    throw err;
  }

  const startDate = new Date(weekStart);
  if (isNaN(startDate.getTime())) {
    const err = new Error('Invalid weekStart date format');
    err.statusCode = 400;
    throw err;
  }

  let endDate;
  if (weekEnd) {
    endDate = new Date(weekEnd);
    if (isNaN(endDate.getTime())) {
      const err = new Error('Invalid weekEnd date format');
      err.statusCode = 400;
      throw err;
    }
  } else {
    // Default to 7 days after weekStart minus 1ms
    endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  }

  // 1. Fetch changes within the date window
  const changes = await Change.find({
    detectedAt: { $gte: startDate, $lte: endDate },
  })
    .populate('competitorId', 'name category')
    .sort({ detectedAt: -1 })
    .lean();

  if (changes.length === 0) {
    const err = new Error(
      `No competitor changes recorded between ${startDate.toISOString().slice(0, 10)} and ${endDate.toISOString().slice(0, 10)}. Cannot generate report without activity data.`
    );
    err.statusCode = 404;
    throw err;
  }

  // 2. Fetch any related AI insights for these changes
  const changeIds = changes.map((c) => c._id);
  const insights = await AIInsight.find({ changeId: { $in: changeIds } }).lean();
  const insightsByChangeId = {};
  insights.forEach((ins) => {
    insightsByChangeId[ins.changeId.toString()] = ins;
  });

  // 3. Build prompt and invoke Gemini
  const prompt = buildReportPrompt(
    changes,
    insightsByChangeId,
    startDate.toISOString().slice(0, 10),
    endDate.toISOString().slice(0, 10)
  );

  let rawText;
  try {
    const genai = getClient();
    const model = genai.models;
    const result = await model.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    rawText = result.text;

    if (!rawText || rawText.trim() === '') {
      throw Object.assign(new Error('Gemini returned an empty report response'), { statusCode: 502 });
    }
  } catch (apiErr) {
    const safeMessage = apiErr.message
      ? apiErr.message.replace(config.gemini?.apiKey || '', '[REDACTED]')
      : 'Gemini API call failed';
    const err = new Error(`Gemini report generation error: ${safeMessage}`);
    err.statusCode = apiErr.statusCode || 502;
    throw err;
  }

  // 4. Parse response
  const reportData = parseReportResponse(rawText);

  // 5. Persist to WeeklyReport (upsert by weekStart)
  const report = await WeeklyReport.findOneAndUpdate(
    { weekStart: startDate },
    {
      $set: {
        weekStart: startDate,
        weekEnd: endDate,
        keyChanges: reportData.keyChanges,
        strategicSignals: reportData.strategicSignals,
        recommendations: reportData.recommendations,
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return report;
};

module.exports = {
  generateWeeklyReport,
};
