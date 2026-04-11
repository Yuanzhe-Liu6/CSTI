import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';

import { sampleQuiz, scoreAnswers } from './scoring.js';
import { saveResult, getResult, getStats } from './store.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'csti-backend' });
});

// GET /api/quiz — return 16 sampled questions (4 per axis), no vectors leaked.
app.get('/api/quiz', (req, res) => {
  res.json({ questions: sampleQuiz() });
});

// POST /api/submit — body: { answers: [{ questionId, optionIndex }] }
app.post('/api/submit', (req, res) => {
  const { answers } = req.body ?? {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers must be a non-empty array' });
  }
  try {
    const scored = scoreAnswers(answers);
    const id = randomUUID();
    const record = {
      id,
      createdAt: new Date().toISOString(),
      typeCode: scored.typeCode,
      raw: scored.raw,
      normalized: scored.normalized,
      archetype: scored.archetype,
      personalRoasts: scored.personalRoasts,
    };
    saveResult(record);
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/result/:id — fetch a stored result for share links.
app.get('/api/result/:id', (req, res) => {
  const result = getResult(req.params.id);
  if (!result) return res.status(404).json({ error: 'result not found' });
  res.json(result);
});

// GET /api/stats — type distribution stub for future rarity calc.
app.get('/api/stats', (req, res) => {
  res.json(getStats());
});

app.listen(PORT, () => {
  console.log(`CSTI backend listening on http://localhost:${PORT}`);
});
