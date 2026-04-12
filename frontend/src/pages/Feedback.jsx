import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { submitFeedback } from '../api.js';

/** 分两行展示：上行 4 个、下行 4 个，提交合并为 tags[] */
const TAG_ROWS = [
  ['文案扎心', 'UI很酷', '梗很地道', '老玩家表示很亲切'],
  ['测试太长', '测试太短', '想要更多选手', 'UI有Bug'],
];

const VIBES = [
  { id: 'hit', emoji: '🎯', label: '太准了，这就是我！' },
  { id: 'partial', emoji: '🤔', label: '有点意思，但不全对。' },
  { id: 'miss', emoji: '🚫', label: '离谱，完全不是我。' },
];

const MAX_COMMENT = 200;

export default function Feedback() {
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('result') ?? undefined;

  const [stars, setStars] = useState(0);
  const [vibe, setVibe] = useState(null);
  const [tags, setTags] = useState(() => new Set());
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const canSubmit = stars >= 1 && stars <= 5 && vibe != null;

  const commentLen = comment.length;

  function toggleTag(label) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  const payload = useMemo(
    () => ({
      resultId: resultId || undefined,
      stars,
      vibe,
      tags: Array.from(tags),
      comment: comment.trim(),
    }),
    [resultId, stars, vibe, tags, comment],
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await submitFeedback(payload);
      setDone(true);
    } catch (err) {
      const msg = err?.response?.data?.error ?? err?.message ?? '提交失败';
      setError(typeof msg === 'string' ? msg : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="page page-feedback">
        <h1 className="feedback-title">感谢反馈</h1>
        <p className="feedback-thanks">你的意见会帮助我们改进 CSTI。</p>
        <div className="feedback-done-actions">
          {resultId ? (
            <Link to={`/result/${resultId}`} className="btn">
              返回结果
            </Link>
          ) : null}
          <Link to="/" className="btn btn-primary">
            回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-feedback">
      <p className="feedback-eyebrow">CSTI · 反馈</p>
      <h1 className="feedback-title">给我们一点反馈</h1>
      <p className="feedback-lead">
        求求热爱 CS 的你花十几秒打个分，帮我们校准模型与文案，让社区变得更好。
      </p>

      <form className="feedback-form" onSubmit={onSubmit}>
        <section className="feedback-section" aria-labelledby="like-stars-label">
          <h2 id="like-stars-label" className="feedback-section-title">
            喜欢程度
          </h2>
          <p className="feedback-question">你有多喜欢这次 CSTI 结果？</p>
          <div className="star-row" role="group" aria-label="喜欢程度 1 到 5 星">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`star-btn ${n <= stars ? 'star-btn-on' : ''}`}
                onClick={() => setStars(n)}
                aria-label={`将喜欢程度设为 ${n} 星`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="feedback-hint">
            {stars === 0 ? '请点选 1～5 星' : `已选：${stars} 星`}
          </p>
        </section>

        <section className="feedback-section" aria-labelledby="fit-vibe-label">
          <h2 id="fit-vibe-label" className="feedback-section-title">
            结果符合度
          </h2>
          <p className="feedback-question-sub">你觉得这个结果「准」吗？</p>
          <div className="vibe-grid" role="radiogroup" aria-label="结果是否符合你">
            {VIBES.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`vibe-card ${vibe === v.id ? 'vibe-card-selected' : ''}`}
                onClick={() => setVibe(v.id)}
                role="radio"
                aria-checked={vibe === v.id}
              >
                <span className="vibe-emoji" aria-hidden>
                  {v.emoji}
                </span>
                <span className="vibe-label">{v.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="feedback-section" aria-labelledby="tags-label">
          <h2 id="tags-label" className="feedback-section-title">
            标签反馈
          </h2>
          <div className="tag-rows">
            {TAG_ROWS.map((row, ri) => (
              <div key={ri} className="tag-chips tag-chips-row">
                {row.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tag-chip ${tags.has(t) ? 'tag-chip-on' : ''}`}
                    onClick={() => toggleTag(t)}
                    aria-pressed={tags.has(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="feedback-section" aria-labelledby="comment-label">
          <label id="comment-label" className="feedback-section-title" htmlFor="fb-comment">
            补充说明（选填）
          </label>
          <textarea
            id="fb-comment"
            className="feedback-textarea"
            rows={4}
            maxLength={MAX_COMMENT}
            placeholder="还想说什么？最多 200 字。"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
          />
          <p className="feedback-counter">
            {commentLen} / {MAX_COMMENT}
          </p>
        </section>

        {error ? <p className="error feedback-error">{error}</p> : null}

        <div className="feedback-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || submitting}
          >
            {submitting ? '提交中…' : '提交反馈'}
          </button>
          <Link to={resultId ? `/result/${resultId}` : '/'} className="btn">
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
