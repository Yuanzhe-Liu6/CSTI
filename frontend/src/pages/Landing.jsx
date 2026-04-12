import { Link } from 'react-router-dom';

/** 16 种原型四字母码：P/R × M/I × E/U × C/H（可按需调整顺序） */
const ARCHETYPE_CODES = [
  'PMEC', 'PMEH', 'PMUC', 'PMUH',
  'PIEC', 'PIEH', 'PIUC', 'PIUH',
  'RMEC', 'RMEH', 'RMUC', 'RMUH',
  'RIEC', 'RIEH', 'RIUC', 'RIUH',
];

/** 将此处改为两位作者署名 */
const AUTHORS = ['B站@willwen96', 'B站@还让不让人好好起名字'];

function CodeMarquee({ codes }) {
  const row = [...codes, ...codes];
  return (
    <div className="landing-code-marquee" aria-hidden="true">
      <div className="landing-code-track">
        {row.map((code, i) => (
          <span key={`${code}-${i}`} className="landing-code-tag">
            {code}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="page page-landing">
      <h1 className="landing-headline">
        CSTI：CS 竞技人格模型
      </h1>
      <p className="blurb landing-blurb">
        基于 16 个职业选手原型的心理量化测试。
        <br />
        通过 20 个动态场景权重计算，得出你的 4 维轴线坐标。
      </p>

      <CodeMarquee codes={ARCHETYPE_CODES} />

      <Link to="/quiz" className="btn btn-primary">开始测试</Link>

      <p className="meta landing-meta">
        轴线：P/R · M/I · E/U · C/H · 16 种原型
        {' · '}
        <Link to="/axes" className="text-link">
          八维释义
        </Link>
      </p>

      <p className="landing-authors">
        <span className="landing-authors-label">作者：</span>
        {AUTHORS.map((name, i) => (
          <span key={name}>
            {i > 0 ? ' & ' : null}
            <span className="landing-author-handle">{name}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
