import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-left">
        <Link to="/" className="brand">
          <span className="brand-mark">CS</span>
          <span className="brand-name">TI</span>
        </Link>
        <span className="brand-sub">竞技人格指标</span>
      </div>
      <nav className="site-header-nav" aria-label="站内导航">
        <Link to="/axes" className="header-link">
          四轴说明
        </Link>
      </nav>
    </header>
  );
}
