import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import History from './pages/History';
import Tools from './pages/Tools';
import UserGuide from './pages/UserGuide';
import { Privacy, Terms, Disclaimer } from './pages/LegalPages';
import ScrollToTopButton from './components/ScrollToTopButton';

function App() {
  return (
    <>
      <div className="animated-bg"></div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="history_page" element={<History />} />
            <Route path="tools" element={<Tools />} />
            <Route path="user_guide" element={<UserGuide />} />

            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="disclaimer" element={<Disclaimer />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ScrollToTopButton /> {/* Fixed button */}
    </>
  );
}

export default App;
