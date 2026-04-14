import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuiz, submitAnswers } from '../api.js';

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionIndex
  const [submitting, setSubmitting] = useState(false);
  const [tiebreaker, setTiebreaker] = useState(null);
  const [pendingMainAnswers, setPendingMainAnswers] = useState(null);
  const [tiebreakerAnswers, setTiebreakerAnswers] = useState([]);

  useEffect(() => {
    fetchQuiz()
      .then((data) => setQuestions(data.questions))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page"><p className="error">加载失败：{error}</p></div>;
  if (!questions) return <div className="page"><p>加载中…</p></div>;

  const q = questions[idx];
  const total = questions.length;
  const isLast = idx === total - 1;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const pick = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
  };

  const next = () => {
    if (!isLast) setIdx(idx + 1);
  };
  const prev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  const runSubmit = async (mainPayload, tieList) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAnswers({
        answers: mainPayload,
        tiebreakers: tieList,
      });
      if (result.needsTiebreak) {
        setPendingMainAnswers(mainPayload);
        setTiebreakerAnswers(tieList);
        setTiebreaker(result.tiebreaker);
        setSubmitting(false);
        return;
      }
      navigate(`/result/${result.id}`, { state: { result } });
    } catch (e) {
      setError(e.message ?? String(e));
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!allAnswered || submitting) return;
    const payload = questions.map((q) => ({
      questionId: q.id,
      optionIndex: answers[q.id],
    }));
    await runSubmit(payload, []);
  };

  const submitTiebreak = async (optionIndex) => {
    if (!tiebreaker || pendingMainAnswers == null || submitting) return;
    const next = [
      ...tiebreakerAnswers,
      { questionId: tiebreaker.id, optionIndex },
    ];
    await runSubmit(pendingMainAnswers, next);
  };

  return (
    <div className="page page-quiz">
      <div className="quiz-header">
        <span className="progress">{idx + 1} / {total}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>
      <h2 className="scenario">{q.scenario}</h2>
      <ul className="options">
        {q.options.map((opt) => {
          const selected = answers[q.id] === opt.index;
          return (
            <li key={opt.index}>
              <button
                className={`option ${selected ? 'selected' : ''}`}
                onClick={() => pick(opt.index)}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="quiz-nav">
        <button onClick={prev} disabled={idx === 0}>上一题</button>
        {isLast ? (
          <button
            className="btn-primary"
            onClick={submit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? '计算中…' : '提交'}
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={next}
            disabled={answers[q.id] === undefined}
          >
            下一题
          </button>
        )}
      </div>

      {tiebreaker ? (
        <div className="tiebreak-backdrop" role="dialog" aria-modal="true" aria-labelledby="tiebreak-title">
          <div className="tiebreak-panel">
            <p id="tiebreak-title" className="tiebreak-title">平局加试（二选一）</p>
            <p className="tiebreak-hint">
              有维度刚好50/50，再选一项即可生成结果（一道题也可能同时打破多个平局）。
            </p>
            <h2 className="scenario tiebreak-scenario">{tiebreaker.scenario}</h2>
            <ul className="options">
              {tiebreaker.options.map((opt) => (
                <li key={opt.index}>
                  <button
                    type="button"
                    className="option"
                    onClick={() => submitTiebreak(opt.index)}
                    disabled={submitting}
                  >
                    {opt.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
