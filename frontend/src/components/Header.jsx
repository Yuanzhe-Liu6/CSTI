import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark">CS</span>
        <span className="brand-name">TI</span>
      </Link>
      <span className="brand-sub">Counter-Strike Type Indicator</span>
    </header>
  );
}
