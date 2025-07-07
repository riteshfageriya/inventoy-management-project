import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="card">
        <h1>Welcome to Frames Inventory Management System</h1>
        <p>
          This system helps frame distributors and shops manage their inventory, track sales,
          and streamline the billing process.
        </p>
        <div style={{ marginTop: '20px' }}>
          <Link to="/login" className="button">
            Login to Get Started
          </Link>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h2>System Features</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3>For Shops</h3>
            <ul>
              <li>Search for frames by ID or name</li>
              <li>View available inventory</li>
              <li>Record sales with different lens types</li>
              <li>Track monthly sales</li>
            </ul>
          </div>
          
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3>For Distributors</h3>
            <ul>
              <li>Manage multiple shops</li>
              <li>Upload inventory via CSV</li>
              <li>Monitor sales across all shops</li>
              <li>Generate monthly billing reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
