import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('shop'); // 'shop' or 'distributor'
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Simple authentication simulation
  const handleLogin = (e) => {
    e.preventDefault();
    
    if (loginType === 'shop' && !selectedShopId) {
      alert('Please select a shop');
      return;
    }
    
    // Store user type in localStorage
    localStorage.setItem('userType', loginType);
    
    if (loginType === 'shop') {
      localStorage.setItem('shopId', selectedShopId);
      navigate('/shop-portal');
    } else {
      navigate('/distributor-portal');
    }
  };
  
  useEffect(() => {
    if (loginType === 'shop') {
      setIsLoading(true);
      axios.get('http://localhost:5000/api/shops')
        .then(response => {
          setShops(response.data);
          setIsLoading(false);
          if (response.data.length > 0) {
            setSelectedShopId(response.data[0].id);
          }
        })
        .catch(error => {
          console.error('Error fetching shops:', error);
          setIsLoading(false);
        });
    }
  }, [loginType]);
  
  return (
    <div className="login-page">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Login as:</label>
            <div style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
              <label>
                <input
                  type="radio"
                  value="shop"
                  checked={loginType === 'shop'}
                  onChange={() => setLoginType('shop')}
                />
                Shop
              </label>
              <label>
                <input
                  type="radio"
                  value="distributor"
                  checked={loginType === 'distributor'}
                  onChange={() => setLoginType('distributor')}
                />
                Distributor
              </label>
            </div>
          </div>
          
          {loginType === 'shop' && (
            <div className="form-group">
              <label>Select Shop:</label>
              {isLoading ? (
                <p>Loading shops...</p>
              ) : shops.length > 0 ? (
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="form-control"
                >
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p>No shops available. Please contact the distributor.</p>
              )}
            </div>
          )}
          
          <button 
            type="submit" 
            className="button" 
            disabled={loginType === 'shop' && (isLoading || shops.length === 0)}
            style={{ marginTop: '20px' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
