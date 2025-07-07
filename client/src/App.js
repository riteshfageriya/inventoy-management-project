import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import ShopPortal from './pages/ShopPortal';
import DistributorPortal from './pages/DistributorPortal';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/shop-portal/*" element={<ShopPortal />} />
            <Route path="/distributor-portal/*" element={<DistributorPortal />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
