import { questionsById, archetypeByCode, roasts } from './data.js';

const AXES = ['PR', 'MI', 'EU', 'CH'];
const LETTERS = { PR: ['P', 'R'], MI: ['M', 'I'], EU: ['E', 'U'], CH: ['C', 'H'] };
const DIMS = ['P', 'R', 'M', 'I', 'E', 'U', 'C', 'H'];

/** Epsilon for axis tie: normalized first pole === 0.5, or both raw totals zero. */
const AXIS_TIE_EPS = 1e-9;

/** How many scenarios to draw from each axis pool (4 axes → 20 total). */
export const QUESTIONS_PER_AXIS = 5;

const emptyScores = () => Object.fromEntries(DIMS.map((d) => [d, 0]));

/**
 * Sample 20 questions: 5 per axis from the 32-question pool.
 * Returns the public-facing shape (no vectors leaked).
 */
const byAxis = (() => {
  const map = new Map(AXES.map((a) => [a, []]));
  for (const q of questionsById.values()) map.get(q.axis).push(q);
  return map;
})();

export function sampleQuiz() {
  const picked = [];
  for (const axis of AXES) {
    const pool = byAxis.get(axis).slice();
    shuffle(pool);
    picked.push(...pool.slice(0, QUESTIONS_PER_AXIS));
  }
  shuffle(picked);
  return picked.map((q) => ({
    id: q.id,
    axis: q.axis,
    scenario: q.scenario,
    options: q.options.map((o, i) => ({ index: i, text: o.text })),
  }));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Compute raw 8-d weighted scores from answers.
 * answers = [{ questionId, optionIndex }]
 */
export function computeRawScores(answers) {
  const raw = emptyScores();
  for (const { questionId, optionIndex } of answers) {
    const q = questionsById.get(questionId);
    if (!q) throw new Error(`Unknown question: ${questionId}`);
    const opt = q.options[optionIndex];
    if (!opt) throw new Error(`Bad optionIndex ${optionIndex} for ${questionId}`);
    const w = q.weight ?? 1;
    for (const d of DIMS) raw[d] += (opt.vector[d] ?? 0) * w;
  }
  return raw;
}

/**
 * Normalize each axis pair to [0,1] dominance for the first letter.
 * e.g. axisDominance.P = P / (P + R)  (defaults to 0.5 if both zero).
 */
export function normalizeAxes(raw) {
  const out = {};
  for (const axis of AXES) {
    const [a, b] = LETTERS[axis];
    const total = raw[a] + raw[b];
    out[a] = total > 0 ? raw[a] / total : 0.5;
    out[b] = total > 0 ? raw[b] / total : 0.5;
  }
  return out;
}

/**
 * Axes where each pole is exactly balanced (normalized === 0.5), including the
 * both-zero case for that axis.
 */
export function getTiedAxes(raw) {
  const tied = [];
  for (const axis of AXES) {
    const [a, b] = LETTERS[axis];
    const tot = raw[a] + raw[b];
    if (tot <= 0) {
      tied.push(axis);
      continue;
    }
    const na = raw[a] / tot;
    if (Math.abs(na - 0.5) <= AXIS_TIE_EPS) tied.push(axis);
  }
  return tied;
}

/** Per-option score skew on this question's axis: (poleA − poleB) × weight. */
function optionAxisSkew(q, optionIndex) {
  const [poleA, poleB] = LETTERS[q.axis];
  const opt = q.options[optionIndex];
  const w = q.weight ?? 1;
  const va = opt.vector?.[poleA] ?? 0;
  const vb = opt.vector?.[poleB] ?? 0;
  return (va - vb) * w;
}

/**
 * Pick two option indices (original indices into q.options) for a binary tiebreak.
 * Prefer extremes on this question's axis; if all options tie on that axis, pick the
 * pair whose vectors differ most across all axes (one answer can break several ties).
 */
export function pickTwoOptionIndicesForTiebreak(q) {
  const n = q.options.length;
  if (n < 2) return null;

  const skews = [];
  for (let i = 0; i < n; i++) skews.push({ i, d: optionAxisSkew(q, i) });

  let minI = 0;
  let maxI = 0;
  for (let k = 1; k < skews.length; k++) {
    if (skews[k].d < skews[minI].d) minI = k;
    if (skews[k].d > skews[maxI].d) maxI = k;
  }

  if (Math.abs(skews[minI].d - skews[maxI].d) > AXIS_TIE_EPS) {
    const a = skews[minI].i;
    const b = skews[maxI].i;
    return a < b ? [a, b] : [b, a];
  }

  const w = q.weight ?? 1;
  let best = [0, 1];
  let bestScore = -1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let s = 0;
      for (const axis of AXES) {
        const [x, y] = LETTERS[axis];
        const di = ((q.options[i].vector?.[x] ?? 0) - (q.options[i].vector?.[y] ?? 0)) * w;
        const dj = ((q.options[j].vector?.[x] ?? 0) - (q.options[j].vector?.[y] ?? 0)) * w;
        s += Math.abs(di - dj);
      }
      if (s > bestScore) {
        bestScore = s;
        best = [i, j];
      }
    }
  }
  return best;
}

/**
 * Sample a tiebreaker question from axes that are still tied (excluding already-used ids).
 * Returns a public shape with exactly two options (original option indices preserved).
 */
export function pickTiebreakerQuestion(tiedAxes, usedQuestionIds) {
  if (!tiedAxes.length) return null;
  const used = new Set(usedQuestionIds);
  const seen = new Set();
  const pool = [];
  for (const axis of tiedAxes) {
    for (const q of byAxis.get(axis) || []) {
      if (used.has(q.id) || seen.has(q.id)) continue;
      seen.add(q.id);
      pool.push(q);
    }
  }
  shuffle(pool);
  for (const q of pool) {
    const pair = pickTwoOptionIndicesForTiebreak(q);
    if (!pair) continue;
    const [i0, i1] = pair;
    return {
      id: q.id,
      axis: q.axis,
      scenario: q.scenario,
      options: [
        { index: i0, text: q.options[i0].text },
        { index: i1, text: q.options[i1].text },
      ],
    };
  }
  return null;
}

/** Build the 4-letter type code from raw scores. Ties favor the first letter. */
export function buildTypeCode(raw) {
  return AXES.map((axis) => {
    const [a, b] = LETTERS[axis];
    return raw[a] >= raw[b] ? a : b;
  }).join('');
}

/**
 * When no tiebreaker can be offered, fall back to the legacy rule (left pole wins)
 * and compute type / roasts for persistence.
 */
export function finalizeTiesWithLeftBias(raw) {
  const normalized = normalizeAxes(raw);
  const typeCode = buildTypeCode(raw);
  const archetype = archetypeByCode.get(typeCode) || null;
  const personalRoasts = matchRoasts(normalized);
  return {
    normalized,
    typeCode,
    archetype,
    personalRoasts,
    tiedAxes: [],
    needsTiebreak: false,
  };
}

/** Match roasts whose conditions are all satisfied by the normalized scores. */
export function matchRoasts(normalized) {
  const matched = [];
  for (const line of roasts) {
    let ok = true;
    for (const [dim, expr] of Object.entries(line.condition)) {
      const val = normalized[dim];
      if (val === undefined || !evalCondition(val, expr)) {
        ok = false;
        break;
      }
    }
    if (ok) matched.push(line.text);
  }
  return matched;
}

function evalCondition(val, expr) {
  const m = /^(>=|<=|>|<|==)\s*(-?\d*\.?\d+)$/.exec(expr.trim());
  if (!m) return false;
  const [, op, numStr] = m;
  const n = Number(numStr);
  switch (op) {
    case '>=': return val >= n;
    case '<=': return val <= n;
    case '>':  return val > n;
    case '<':  return val < n;
    case '==': return val === n;
    default:   return false;
  }
}

/** Full scoring pipeline: answers → result payload. */
export function scoreAnswers(answers) {
  const raw = computeRawScores(answers);
  const normalized = normalizeAxes(raw);
  const tiedAxes = getTiedAxes(raw);
  const needsTiebreak = tiedAxes.length > 0;
  const typeCode = needsTiebreak ? null : buildTypeCode(raw);
  const archetype = typeCode ? archetypeByCode.get(typeCode) || null : null;
  const personalRoasts = needsTiebreak ? [] : matchRoasts(normalized);
  return { raw, normalized, typeCode, archetype, personalRoasts, tiedAxes, needsTiebreak };
}
