import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreAnswers,
  getTiedAxes,
  pickTiebreakerQuestion,
  pickTwoOptionIndicesForTiebreak,
  finalizeTiesWithLeftBias,
  computeRawScores,
} from '../src/scoring.js';
import { questionsById } from '../src/data.js';

describe('getTiedAxes', () => {
  it('marks an axis tied when raw poles are equal and total > 0', () => {
    const raw = { P: 5, R: 5, M: 3, I: 2, E: 1, U: 4, C: 2, H: 1 };
    assert.deepEqual(getTiedAxes(raw), ['PR']);
  });

  it('marks every axis tied when both poles are zero', () => {
    const z = { P: 0, R: 0, M: 0, I: 0, E: 0, U: 0, C: 0, H: 0 };
    assert.deepEqual(getTiedAxes(z), ['PR', 'MI', 'EU', 'CH']);
  });
});

describe('scoreAnswers tie detection', () => {
  it('requires tiebreak for q1 option 2 (balanced P/R and empty EU/CH poles)', () => {
    const scored = scoreAnswers([{ questionId: 'q1', optionIndex: 2 }]);
    assert.equal(scored.needsTiebreak, true);
    assert.ok(scored.tiedAxes.includes('PR'));
    assert.ok(scored.tiedAxes.includes('EU'));
    assert.ok(scored.tiedAxes.includes('CH'));
    assert.equal(scored.typeCode, null);
    assert.equal(scored.archetype, null);
    assert.deepEqual(scored.personalRoasts, []);
  });

  it('returns a type code once all axes are decided (hand-picked answer chain)', () => {
    const merged = [
      { questionId: 'q1', optionIndex: 2 },
      { questionId: 'q2', optionIndex: 0 },
      { questionId: 'q9', optionIndex: 2 },
      { questionId: 'q19', optionIndex: 0 },
    ];
    const scored = scoreAnswers(merged);
    assert.equal(scored.needsTiebreak, false);
    assert.equal(scored.tiedAxes.length, 0);
    assert.match(scored.typeCode, /^[PRMIUECH]{4}$/);
    assert.ok(scored.archetype || scored.typeCode);
  });
});

describe('pickTiebreakerQuestion', () => {
  it('returns exactly two options and skips already-used question ids', () => {
    const tb = pickTiebreakerQuestion(['PR', 'EU'], new Set(['q1']));
    assert.ok(tb);
    assert.equal(tb.options.length, 2);
    assert.notEqual(tb.id, 'q1');
    const q = questionsById.get(tb.id);
    assert.ok(q);
    const idxs = new Set(tb.options.map((o) => o.index));
    assert.equal(idxs.size, 2);
    for (const o of tb.options) {
      assert.equal(typeof o.text, 'string');
      assert.ok(o.text.length > 0);
    }
  });

  it('returns null when there is nothing to break', () => {
    assert.equal(pickTiebreakerQuestion([], new Set()), null);
  });
});

describe('pickTwoOptionIndicesForTiebreak', () => {
  it('returns two distinct indices for a normal question', () => {
    const q = questionsById.get('q1');
    const pair = pickTwoOptionIndicesForTiebreak(q);
    assert.ok(pair);
    assert.equal(pair.length, 2);
    assert.notEqual(pair[0], pair[1]);
  });
});

describe('finalizeTiesWithLeftBias', () => {
  it('uses legacy left-pole preference when forcing a code', () => {
    const raw = { P: 1, R: 1, M: 1, I: 1, E: 1, U: 1, C: 1, H: 1 };
    const out = finalizeTiesWithLeftBias(raw);
    assert.equal(out.needsTiebreak, false);
    assert.equal(out.typeCode, 'PMEC');
    assert.equal(out.tiedAxes.length, 0);
  });
});

describe('computeRawScores + getTiedAxes (empty quiz)', () => {
  it('empty answers yield all-zero raw and every axis tied', () => {
    const raw = computeRawScores([]);
    assert.deepEqual(
      raw,
      { P: 0, R: 0, M: 0, I: 0, E: 0, U: 0, C: 0, H: 0 },
    );
    assert.deepEqual(getTiedAxes(raw), ['PR', 'MI', 'EU', 'CH']);
    const scored = scoreAnswers([]);
    assert.equal(scored.needsTiebreak, true);
  });
});
