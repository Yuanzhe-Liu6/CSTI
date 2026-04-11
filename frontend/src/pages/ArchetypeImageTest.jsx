import { Link } from 'react-router-dom';
import archetypesData from '../../../backend/data/archetypes.json';

export default function ArchetypeImageTest() {
  const list = archetypesData.archetypes ?? [];

  function proAvatarSrc(pro) {
    const file = `${pro}.webp`;
    return `/archetypes/${file}`;
  }

  return (
    <div className="page page-archetype-test">
      <p className="archetype-test-nav">
        <Link to="/" className="btn">返回首页</Link>
      </p>
      <h1 className="archetype-test-title">选手头像预览 / Avatar preview</h1>
      <p className="archetype-test-hint">
        与结果页相同的 <code>.player-avatar</code> 样式 · 共 {list.length} 张
      </p>

      <ul className="archetype-test-grid">
        {list.map(({ code, pro, title }) => (
          <li key={code} className="archetype-test-card">
            <p className="archetype-test-code">{code}</p>
            <div className="player-avatar-wrap">
              <img
                className="player-avatar"
                src={proAvatarSrc(pro)}
                alt=""
                width={534}
                height={534}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="archetype-test-pro">≈ {pro}</p>
            <p className="archetype-test-sub">{title}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
