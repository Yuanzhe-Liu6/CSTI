import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchResult } from '../api.js';
import AxisRadar from '../components/AxisRadar.jsx';
import ResultPoster from '../components/ResultPoster.jsx';

const AXIS_INFO = {
  P: { label: 'Proactive 主动型', desc: '倾向于主动出击、带节奏、第一个冲进点位。你是进攻的发起者，喜欢用行动创造机会而非等待。' },
  R: { label: 'Reactive 被动型', desc: '倾向于以逸待劳、等待对手犯错后精准反击。你是沉稳的防守者，擅长在对手露出破绽时致命一击。' },
  M: { label: 'Mechanics 机械型', desc: '依赖纯粹的枪法、反应速度和肌肉记忆。你的武器是手速和准星，用操作碾压对手。' },
  I: { label: 'Intelligence 智慧型', desc: '依赖地图理解、读局能力和战术执行。你的武器是大脑，用预判和策略取胜。' },
  E: { label: 'Ego 自我型', desc: '以个人表现为核心驱动力，追求高光时刻和数据。你相信个人英雄主义能改变比赛走向。' },
  U: { label: 'Utility 团队型', desc: '以团队利益为核心驱动力，甘愿牺牲数据为队友创造输出环境。你是默默付出的基石。' },
  C: { label: 'Chilled 冷静型', desc: '情绪波动极小，无论顺逆风都保持冷酷的执行力。你是队伍的定海神针，稳定就是你的超能力。' },
  H: { label: 'Hyped 激昂型', desc: '情绪充沛、激情四射，用能量感染全队。你的呐喊和激情是队伍士气的发动机。' },
};

export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result ?? null);
  const [error, setError] = useState(null);
  const [expandedAxis, setExpandedAxis] = useState(null);

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
            const na = normalized[a] ?? 0.5;
            const nb = normalized[b] ?? 0.5;
            const dominant = na >= nb ? a : b;
            const loser = dominant === a ? b : a;
            const domScore = dominant === a ? na : nb;
            const pct = Math.round(domScore * 100);
            const axisKey = `${a}${b}`;
            const isExpanded = expandedAxis === axisKey;
            return (
              <li key={a} className={`axis-item${isExpanded ? ' expanded' : ''}`}>
                <div
                  className="axis-label axis-label-clickable"
                  onClick={() => setExpandedAxis(isExpanded ? null : axisKey)}
                  title="点击查看维度说明"
                >
                  <span className="axis-dominant">{dominant} {raw[dominant]}</span>
                  <span className="axis-tap-hint">{isExpanded ? '▾' : '▸'}</span>
                  <span>{loser} {raw[loser]}</span>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
                {isExpanded && (
                  <div className="axis-explain">
                    <div className="axis-explain-item highlight">
                      <strong>{AXIS_INFO[dominant].label}</strong>
                      <p>{AXIS_INFO[dominant].desc}</p>
                    </div>
                    <div className="axis-explain-item">
                      <strong>{AXIS_INFO[loser].label}</strong>
                      <p>{AXIS_INFO[loser].desc}</p>
                    </div>
                  </div>
                )}
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
      <p className="share-hint">
        邀请好友测试：<code>{`${window.location.origin}/`}</code>
      </p>
    </div>
  );
}
