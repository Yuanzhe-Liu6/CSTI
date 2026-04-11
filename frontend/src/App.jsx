import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Landing from './pages/Landing.jsx';
import Quiz from './pages/Quiz.jsx';
import Result from './pages/Result.jsx';
import NotFound from './pages/NotFound.jsx';
import ArchetypeImageTest from './pages/ArchetypeImageTest.jsx';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/test/archetype-images" element={<ArchetypeImageTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>v0.1 · MVP · No login</span>
      </footer>
    </div>
  );
}
