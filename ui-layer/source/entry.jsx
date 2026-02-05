import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ComparisonView from './pages/ComparisonView';
import LiveStreamView from './pages/LiveStreamView';
import './styling.css';

function NavigationBar() {
  return (
    <nav className="top-nav">
      <div className="nav-brand">Payment Processor Analytics</div>
      <div className="nav-links">
        <Link to="/" className="nav-item">Charts & Comparison</Link>
        <Link to="/live-feed" className="nav-item">Live Transaction Feed</Link>
      </div>
    </nav>
  );
}

function ApplicationShell() {
  return (
    <BrowserRouter>
      <NavigationBar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<ComparisonView />} />
          <Route path="/live-feed" element={<LiveStreamView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ApplicationShell />);
