import { questionsById, archetypeByCode, roasts } from './data.js';

const AXES = ['PR', 'MI', 'EU', 'CH'];
const LETTERS = { PR: ['P', 'R'], MI: ['M', 'I'], EU: ['E', 'U'], CH: ['C', 'H'] };
const DIMS = ['P', 'R', 'M', 'I', 'E', 'U', 'C', 'H'];

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

/** Build the 4-letter type code from raw scores. Ties favor the first letter. */
export function buildTypeCode(raw) {
  return AXES.map((axis) => {
    const [a, b] = LETTERS[axis];
    return raw[a] >= raw[b] ? a : b;
  }).join('');
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
  const typeCode = buildTypeCode(raw);
  const archetype = archetypeByCode.get(typeCode) || null;
  const personalRoasts = matchRoasts(normalized);
  return { raw, normalized, typeCode, archetype, personalRoasts };
}
