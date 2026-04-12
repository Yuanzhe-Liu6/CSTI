import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchQuiz, submitAnswers } from '../api.js';

export default function Quiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionIndex
  const [submitting, setSubmitting] = useState(false);

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

  const submit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        optionIndex: answers[q.id],
      }));
      const result = await submitAnswers(payload);
      navigate(`/result/${result.id}`, { state: { result } });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
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
    </div>
  );
}
