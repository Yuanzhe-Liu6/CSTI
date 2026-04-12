import { Link } from 'react-router-dom';
import { AXIS_GROUPS } from '../data/axisLabels.js';

export default function AxesLegend() {
  return (
    <div className="page page-axes">
      <p className="axes-eyebrow">CSTI · 四轴八维</p>
      <h1 className="axes-title">字母分别代表什么？</h1>
      <p className="axes-lead">
        测试会在每条选项里为八个字母累加权重；四组对立字母刻画你在 CS
        竞技场景里的倾向。得分会归一化到 0–1，并在结果页以四轴滑条与雷达呈现。
      </p>

      <div className="axes-list">
        {AXIS_GROUPS.map((g) => (
          <section key={g.id} className="axes-card">
            <div className="axes-vs-en" aria-label="英文轴名">
              <div className="axes-vs-line">
                {g.poles[0].letter} ({g.poles[0].english})
              </div>
              <div className="axes-vs-word">vs.</div>
              <div className="axes-vs-line">
                {g.poles[1].letter} ({g.poles[1].english})
              </div>
            </div>
            <p className="axes-contrast-zh">{g.contrastZh}</p>
            <ul className="axes-poles">
              {g.poles.map((p) => (
                <li key={p.letter}>
                  <p className="axes-pole-line">
                    <span className="axes-letter">{p.letter}</span>
                    <span className="axes-pole-colon">:</span>
                    <span className="axes-pole-detail">{p.detail}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="axes-actions">
        <Link to="/quiz" className="btn btn-primary">
          去做题
        </Link>
        <Link to="/" className="btn">
          回首页
        </Link>
      </div>
    </div>
  );
}
