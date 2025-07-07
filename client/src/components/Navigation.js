import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = React.useState(localStorage.getItem('userType') || null);

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('shopId');
    setUserType(null);
    navigate('/login');
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="nav-logo">
          Frames Inventory System
        </div>
        <div className="nav-links">
          {!userType ? (
            <>
              <Link to="/">Home</Link>
              <Link to="/login">Login</Link>
            </>
          ) : userType === 'shop' ? (
            <>
              <Link to="/shop-portal">Dashboard</Link>
              <Link to="/shop-portal/inventory">Inventory</Link>
              <Link to="/shop-portal/sales">Sales</Link>
              <button onClick={handleLogout} className="button secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/distributor-portal">Dashboard</Link>
              <Link to="/distributor-portal/shops">Manage Shops</Link>
              <Link to="/distributor-portal/inventory">Inventory</Link>
              <Link to="/distributor-portal/billing">Billing</Link>
              <button onClick={handleLogout} className="button secondary">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
