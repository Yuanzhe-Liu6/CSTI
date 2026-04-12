# CSTI — Counter-Strike Type Indicator

A humorous "competitive personality" quiz for CS players. Built from the design doc in [`CS 玩家风格测试设计文档.pdf`](CS%20玩家风格测试设计文档.pdf).

**Stack:** Node.js (Express) backend + React (Vite) frontend. No auth in MVP.

---

## Repo layout

```
CSTI/
├── backend/    # Express API (Node 18+, ESM)
│   └── data/   # questions.json, archetypes.json, roasts.json
└── frontend/   # React + Vite
```

## Prerequisites

- **Node.js 18+** and npm

## Setup

Install dependencies for both apps (run once after cloning):

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Run (development)

Open **two terminals**:

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

The frontend dev server proxies `/api/*` to the backend at `:4000`, so you can call the API with relative URLs.

### Health check

After starting the backend: <http://localhost:4000/api/health> should return `{"status":"ok","service":"csti-backend"}`.

## Static data files

The backend reads from [`backend/data/`](backend/data/):

| File | Content |
|---|---|
| [`questions.json`](backend/data/questions.json) | 32 scenario questions, 8 per axis (PR/MI/EU/CH). Each option has a weighted 8-d vector. |
| [`archetypes.json`](backend/data/archetypes.json) | 16 archetypes (4-letter code → pro player, title, tagline, roast). Codes: PMEH … RIUC. |
| [`roasts.json`](backend/data/roasts.json) | Threshold-based personalized roast lines triggered by extreme axis dominance. |

Quick sanity check (from `backend/`):

```bash
node -e "const q=require('./data/questions.json');console.log('questions:',q.questions.length)"
```

## API endpoints

All endpoints are served from `http://localhost:4000` and return JSON.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness probe — `{status, service}`. |
| `GET` | `/api/quiz` | Returns 20 questions sampled from the 32-pool (5 per axis), shuffled. Option vectors are stripped — only `{id, axis, scenario, options:[{index, text}]}` is exposed. |
| `POST` | `/api/submit` | Body: `{ "answers": [{ "questionId": "q1", "optionIndex": 0 }, ...] }`. Computes weighted vector sum, normalizes per axis pair, derives the 4-letter type code, looks up the matched pro archetype, and returns the full result. Results go to **MongoDB Atlas** when `MONGODB_URI` is loaded at startup (`backend/src/env.js` reads **repo-root** `.env.local` then **`backend/.env.local`** — backend file wins for duplicate keys; see `backend/src/store.js`). If `MONGODB_URI` is missing, data stays in an in-process `Map` until restart. On startup the server logs either `Results store: MongoDB (...)` or `in-memory`. |
| `GET` | `/api/result/:id` | Retrieves a previously submitted result by its UUID — used for share links. 404 if unknown. |
| `GET` | `/api/stats` | Type-code distribution counts so far (MongoDB when configured; otherwise in-memory and lost on restart). Used by the future rarity feature. |
| `POST` | `/api/feedback` | Optional post-quiz survey: stars (1–5), vibe (`hit` / `partial` / `miss`), optional preset tags, optional `comment` (≤200 chars), optional `resultId`. When `MONGODB_URI` is set, documents go to the **`feedback`** collection; otherwise they are kept in memory until the process exits (`saveFeedback` in `backend/src/store.js`). |

Quick end-to-end check (with the backend running on the default port). Uses Node 18+ `fetch` to exercise **quiz → submit → result round-trip → stats** so persistence is covered whether you use Atlas or the in-memory store:

```bash
node --input-type=module -e '
const base = "http://127.0.0.1:4000";
const j = (r) => r.json();
try {
  const quiz = await fetch(base + "/api/quiz").then(j);
  const body = { answers: quiz.questions.map((q) => ({ questionId: q.id, optionIndex: 0 })) };
  const submit = await fetch(base + "/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(j);
  
  if (!submit.id) throw new Error("submit: missing id");
  
  const roundtrip = await fetch(base + "/api/result/" + submit.id).then(j);
  const stats = await fetch(base + "/api/stats").then(j);
  
  console.log("✅ E2E OK:", { type: submit.typeCode, id: submit.id, total: stats.total });
} catch (e) {
  console.error("❌ Test Failed:", e.message);
}
'
"
```

Without `MONGODB_URI`, results and stats reset when the process restarts. With Atlas configured, the same flow confirms documents are written and read back from the database.

## Frontend routes

The SPA is mounted at `http://localhost:5173` and uses `react-router-dom` v6.

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing | Intro copy, author credits, code marquee, link to `/axes`, primary CTA to `/quiz`. |
| `/axes` | AxesLegend | Explains the four axis pairs and eight letters (P/R, M/I, E/U, C/H). |
| `/feedback` | Feedback | Optional survey (stars, vibe, tags, short comment); POSTs to `/api/feedback`. Can open with `?result=` after a quiz. |
| `/quiz` | Quiz | Fetches `/api/quiz`, walks through 20 questions one at a time, posts to `/api/submit`, then redirects to `/result/:id`. |
| `/result/:id` | Result | Renders the type code, archetype/pro/tagline/roast, per-axis dominance bars, and any triggered personalized roasts. Reuses router state when available, otherwise fetches `/api/result/:id`. |
| `/test/archetype-images` | ArchetypeImageTest | Dev helper for archetype imagery (not part of the main user flow). |
| `*` | NotFound | 404 fallback. |

Both servers must be running together — the Vite dev server proxies `/api/*` to the backend at `:4000`, so the frontend uses relative URLs only.

### Components

- [`components/Header.jsx`](frontend/src/components/Header.jsx) — site header with brand mark, shared across all routes.
- [`components/AxisRadar.jsx`](frontend/src/components/AxisRadar.jsx) — 8-dimension radar chart (P/R/M/I/E/U/C/H) rendered with `recharts` on the Result page.
- [`components/ResultPoster.jsx`](frontend/src/components/ResultPoster.jsx) — pure-Canvas (1080×1350) shareable poster generator. Click "下载海报 / Poster" on the result page to download a PNG including the type code, archetype, hand-drawn radar, axis bars, and personalized roasts. No external image libs — uses the platform `<canvas>` API + `toBlob` directly.

### Theme

Dark "CS HUD" palette: near-black background (`#0b0b0d`), elevated panels (`#15151a`), CS:GO-orange accent (`#f5a623`), monospace headings/codes. The layout collapses cleanly under 600 px (header stacks, action buttons go full-width, font sizes shrink). The radar uses the accent color with a soft glow on the type code for emphasis.

> Note: pulling in `recharts` (and its `d3-*` deps) bumped the JS bundle from ~206 KB → ~560 KB (168 KB gzipped). Acceptable for MVP; revisit with code-splitting / a lighter chart lib if size matters later.

## Smoke test

A scripted backend smoke test covers all four endpoints, randomness, scoring discrimination, result roundtrip, stats, and four edge cases (404, missing body, unknown questionId, bad optionIndex). Run with both servers stopped.

The block below is **bash** (macOS/Linux, **Git Bash**, or **WSL**). On **Windows PowerShell**, start the backend in one terminal (`cd backend; $env:PORT = '4002'; node src/index.js`), then in another run the same `node --input-type=module -e` script as in the quick e2e section with `$env:E2E_BASE = 'http://localhost:4002'` before `node`, and use `Invoke-WebRequest` or `curl.exe` instead of `curl` if needed.

```bash
# from repo root
cd backend && PORT=4002 node src/index.js &
SERVER_PID=$!
sleep 1

# Health
curl -s http://localhost:4002/api/health
# Quiz (20 questions, 5 per axis, vectors stripped)
curl -s http://localhost:4002/api/quiz | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s);console.log('count:',o.questions.length)})"
# End-to-end: submit, fetch /api/result/:id, /api/stats (matches quick e2e; respects MONGODB_URI if set)
E2E_BASE=http://localhost:4002 node --input-type=module -e "
const base = process.env.E2E_BASE || 'http://localhost:4000';
const j = (r) => r.json();
const quiz = await fetch(base + '/api/quiz').then(j);
const body = { answers: quiz.questions.map((q) => ({ questionId: q.id, optionIndex: 0 })) };
const submit = await fetch(base + '/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then(j);
if (!submit.id) throw new Error('submit: missing id');
const roundtrip = await fetch(base + '/api/result/' + submit.id).then(j);
if (roundtrip.typeCode !== submit.typeCode) throw new Error('result: typeCode mismatch');
const stats = await fetch(base + '/api/stats').then(j);
if (typeof stats.total !== 'number' || stats.total < 1) throw new Error('stats: unexpected');
console.log('e2e ok:', submit.typeCode, 'stats.total:', stats.total);
"

kill $SERVER_PID
```

**Sanity baselines** (verified Step 7):

| Answer pattern | Type code | Pro |
|---|---|---|
| All option 0 (most aggressive choice) | `PMEH` | donk |
| All option 2 (most passive choice) | `RIUC` | device |

These are the two extremes of the type space and confirm the scoring engine discriminates across all 4 axes correctly.

For the frontend, a manual smoke run covers what the script can't:

1. `cd backend && npm run dev`
2. `cd frontend && npm run dev` (in another terminal)
3. Open <http://localhost:5173>
4. Click **开始测试 / Start** → answer all 20 questions → **提交 / Submit**
5. On the result page, verify: type code, archetype, radar, axis bars, and personalized roasts render correctly
6. Click **下载海报 / Poster** → a `csti-XXXX-xxxxxxxx.png` should download
7. Copy the result URL into a new tab → page rehydrates from `/api/result/:id` (no router state)
8. Resize browser to <600 px → header stacks, buttons go full-width

---

## Project status

**Milestone 1 (MVP) — COMPLETE.** All 7 steps shipped and smoke-tested. See roadmap in the design doc for Milestone 2.

Implementation progress:

- [x] **Step 1** — Project scaffolding (Express + Vite + React)
- [x] **Step 2** — Static data files (questions, archetypes, roasts)
- [x] **Step 3** — Backend API (`/api/quiz`, `/api/submit`, `/api/result/:id`, `/api/stats`, scoring engine)
- [x] **Step 4** — Frontend routing & pages (Landing / Quiz / Result / NotFound)
- [x] **Step 5** — Styling & polish (CS dark theme, recharts radar, mobile responsive)
- [x] **Step 6** — Result poster (client-side Canvas, PNG download)
- [x] **Step 7** — End-to-end smoke test

---

## Disclaimer

**Project nature.** This project exists for **personal learning** and **non-profit fan entertainment** only.

**Copyright.** Professional player portraits, team logos, and related data used or referenced here remain the property of their **original rights holders** (for example HLTV, ESL, the respective teams, or photographers).

**Content treatment.** Source materials may be **filtered or vectorized**. That processing is used **only** to demonstrate the scoring approach and to present personality-matching results in the UI.

**Rights and removal.** If you are a rights holder and believe this project infringes your legitimate interests, please **open a GitHub Issue** on this repository (or use another contact method published by the maintainer). **Relevant content will be removed promptly** upon verified request.

---

## Design reference

The full design doc lives at [`CS 玩家风格测试设计文档.pdf`](CS%20玩家风格测试设计文档.pdf). Key points:

- **4 binary axes:** P/R (Proactive vs Reactive), M/I (Mechanics vs Intelligence), E/U (Ego vs Utility), C/H (Chilled vs Hyped)
- **16 archetypes:** each 4-letter combo maps to a famous pro player (donk = PMEH, device = RIUC, etc.)
- **MVP scoring:** weighted vector sum over 20 questions sampled from a 32-question bank (5 per axis)
