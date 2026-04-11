import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="page page-landing">
      <h1>CSTI</h1>
      <p className="subtitle">Counter-Strike Type Indicator</p>
      <p className="blurb">
        20 道情景题，4 个维度，找出和你最像的职业选手原型。
        <br />
        Answer 20 scenarios across 4 axes to discover your CS pro archetype.
      </p>
      <Link to="/quiz" className="btn btn-primary">开始测试 / Start</Link>
      <p className="meta">
        Axes: P/R · M/I · E/U · C/H · 16 archetypes
      </p>
    </div>
  );
}
