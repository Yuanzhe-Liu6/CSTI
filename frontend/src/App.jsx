import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Landing from './pages/Landing.jsx';
import Quiz from './pages/Quiz.jsx';
import Result from './pages/Result.jsx';
import NotFound from './pages/NotFound.jsx';
import ArchetypeImageTest from './pages/ArchetypeImageTest.jsx';
import AxesLegend from './pages/AxesLegend.jsx';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/axes" element={<AxesLegend />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/test/archetype-images" element={<ArchetypeImageTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="footer-status">
          <span>v0.1 Beta</span>
        </div>
        <p className="disclaimer">
          Non-commercial Project: This is a fan-made project for entertainment purposes only. 
          We do not own the rights to any player images or team logos used. 
          All rights belong to their respective owners (e.g., HLTV, ESL, Teams).
        </p>
      </footer>
    </div>
  );
}
