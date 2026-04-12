import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchResult } from '../api.js';
import AxisRadar from '../components/AxisRadar.jsx';
import ResultPoster from '../components/ResultPoster.jsx';

export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result ?? null);
  const [error, setError] = useState(null);

  function proAvatarSrc(pro) {
    const file = `${pro}.webp`;
    return `/archetypes/${file}`;
  }

  useEffect(() => {
    if (result) return;
    fetchResult(id)
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [id, result]);

  if (error) return <div className="page"><p className="error">加载失败：{error}</p></div>;
  if (!result) return <div className="page"><p>加载中…</p></div>;

  const { typeCode, archetype, raw, normalized, personalRoasts } = result;

  return (
    <div className="page page-result">
      <p className="result-eyebrow">我的 CSTI 类型</p>
      <p className="result-code">{typeCode}</p>
      {archetype && (
        <>
          <div className="player-avatar-wrap">
            <img
              className="player-avatar"
              src={proAvatarSrc(archetype.pro)}
              alt=""
              width={534}
              height={534}
              loading="lazy"
              decoding="async"
            />
          </div>
          <h1 className="result-title">{archetype.title}</h1>
          <p className="result-pro">代表人物：{archetype.pro}</p>
          <p className="result-tagline">{archetype.tagline}</p>
          <p className="result-roast">"{archetype.roast}"</p>
        </>
      )}

      <section className="scores">
        <h3>八维雷达 / 8-D Radar</h3>
        <AxisRadar normalized={normalized} />

        <h3>轴线得分</h3>
        <ul className="axis-bars">
          {[
            ['P', 'R'],
            ['M', 'I'],
            ['E', 'U'],
            ['C', 'H'],
          ].map(([a, b]) => {
            const pct = Math.round((normalized[a] ?? 0.5) * 100);
            return (
              <li key={a}>
                <div className="axis-label">
                  <span>{a} {raw[a]}</span>
                  <span>{raw[b]} {b}</span>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {personalRoasts?.length > 0 && (
        <section className="personal-roasts">
          <h3>深度行为解析</h3>
          <ul>
            {personalRoasts.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="result-actions">
        <Link to="/" className="btn">返回首页</Link>
        <Link to="/quiz" className="btn">再测一次</Link>
        <Link to={`/feedback?result=${id}`} className="btn btn-feedback">
          意见反馈
        </Link>
        <ResultPoster result={result} />
      </div>
      <p className="share-hint">分享链接: <code>{window.location.href}</code></p>
    </div>
  );
}
