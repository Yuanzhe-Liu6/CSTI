import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h1>404</h1>
      <p>这里什么都没有 / Nothing here.</p>
      <Link to="/" className="btn btn-primary">回首页</Link>
    </div>
  );
}
