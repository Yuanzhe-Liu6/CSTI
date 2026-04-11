import './env.js';
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

// GET /api/quiz — return 20 sampled questions (5 per axis), no vectors leaked.
app.get('/api/quiz', (req, res) => {
  res.json({ questions: sampleQuiz() });
});

// POST /api/submit — body: { answers: [{ questionId, optionIndex }] }
app.post('/api/submit', async (req, res) => {
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
    await saveResult(record);
    res.json(record);
  } catch (err) {
    let message = err.message;
    if (/querySrv ENOTFOUND|ENOTFOUND _mongodb\._tcp/i.test(message)) {
      message =
        'MongoDB host could not be resolved. In .env.local, set MONGODB_URI to the real Atlas connection string (Database → Connect → Drivers). Replace any placeholder like CLUSTER_HOST with your actual hostname (e.g. cluster0.xxxxx.mongodb.net).';
    }
    res.status(400).json({ error: message });
  }
});

// GET /api/result/:id — fetch a stored result for share links.
app.get('/api/result/:id', async (req, res) => {
  const result = await getResult(req.params.id);
  if (!result) return res.status(404).json({ error: 'result not found' });
  res.json(result);
});

// GET /api/stats — type distribution stub for future rarity calc.
app.get('/api/stats', async (req, res) => {
  res.json(await getStats());
});

app.listen(PORT, () => {
  console.log(`CSTI backend listening on http://localhost:${PORT}`);
  const dbName = process.env.MONGODB_DB_NAME || 'csti';
  if (process.env.MONGODB_URI) {
    console.log(`Results store: MongoDB (database "${dbName}", collection "results")`);
  } else {
    console.log('Results store: in-memory — MONGODB_URI unset; data is not written to Atlas');
  }
});
