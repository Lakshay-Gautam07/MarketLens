require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  const result = await genai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'Reply with exactly: {"test": true, "model": "working"}',
  });
  console.log('Response:', result.text);
  process.exit(0);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
