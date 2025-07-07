import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Shop Portal Sub-Components
const ShopDashboard = () => {
  const [shopId] = useState(localStorage.getItem('shopId'));
  const [salesData, setSalesData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const salesRes = await axios.get(`http://localhost:5000/api/sales/${shopId}`);
        const inventoryRes = await axios.get(`http://localhost:5000/api/inventory/${shopId}`);
        
        setSalesData(salesRes.data);
        setInventory(inventoryRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    if (shopId) {
      fetchData();
    }
  }, [shopId]);

  // Calculate dashboard metrics
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_price, 0);
  const lowStockItems = inventory.filter(item => item.quantity < 5).length;

  // Get recent sales (last 5)
  const recentSales = salesData.slice(0, 5);

  return (
    <div>
      <h2>Shop Dashboard</h2>
      
      {isLoading ? (
        <p>Loading dashboard data...</p>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Total Sales</h3>
              <p style={{ fontSize: '2rem' }}>{totalSales}</p>
            </div>
            
            <div className="dashboard-card">
              <h3>Total Revenue</h3>
              <p style={{ fontSize: '2rem' }}>${totalRevenue.toFixed(2)}</p>
            </div>
            
            <div className="dashboard-card">
              <h3>Low Stock Alert</h3>
              <p style={{ fontSize: '2rem' }}>{lowStockItems}</p>
              <p>items with less than 5 in stock</p>
            </div>
          </div>

          <div className="card">
            <h3>Recent Sales</h3>
            {recentSales.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Frame</th>
                    <th>Lens Type</th>
                    <th>Total Price</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.product_id}</td>
                      <td>{sale.frame_name}</td>
                      <td>{sale.lens_type}</td>
                      <td>${sale.total_price.toFixed(2)}</td>
                      <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No recent sales</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const InventoryList = () => {
  const [shopId] = useState(localStorage.getItem('shopId'));
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/inventory/${shopId}`);
        setInventory(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setIsLoading(false);
      }
    };
    
    if (shopId) {
      fetchInventory();
    }
  }, [shopId]);
  
  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item => {
    return (
      item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  return (
    <div>
      <h2>Shop Inventory</h2>
      
      <div className="card">
        <div className="form-group">
          <label>Search Frames:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter product ID or name"
            className="form-control"
          />
        </div>
      </div>
      
      {isLoading ? (
        <p>Loading inventory...</p>
      ) : filteredInventory.length > 0 ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id}>
                  <td>{item.product_id}</td>
                  <td>{item.name}</td>
                  <td>{item.description}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {item.quantity > 0 ? (
                      <a href={`/shop-portal/sell/${item.id}`} className="button">
                        Sell
                      </a>
                    ) : (
                      <span style={{ color: 'red' }}>Out of Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No inventory items found</p>
      )}
    </div>
  );
};

const SellFrame = () => {
  const navigate = useNavigate();
  const [shopId] = useState(localStorage.getItem('shopId'));
  const [frameId, setFrameId] = useState('');
  const [frame, setFrame] = useState(null);
  const [lensTypes, setLensTypes] = useState([]);
  const [selectedLensType, setSelectedLensType] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract frame ID from URL
    const path = window.location.pathname;
    const id = path.split('/').pop();
    setFrameId(id);
    
    const fetchData = async () => {
      try {
        // Get lens types
        const lensRes = await axios.get('http://localhost:5000/api/lens-types');
        setLensTypes(lensRes.data);
        
        if (lensRes.data.length > 0) {
          setSelectedLensType(lensRes.data[0].id);
        }
        
        // Get frame details
        const inventoryRes = await axios.get(`http://localhost:5000/api/inventory/${shopId}`);
        const frameData = inventoryRes.data.find(item => item.id.toString() === id);
        
        if (frameData) {
          setFrame(frameData);
          setTotalPrice(frameData.price * lensRes.data[0].price_multiplier);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [shopId]);
  
  const handleLensChange = (e) => {
    const lensId = e.target.value;
    setSelectedLensType(lensId);
    
    // Calculate total price
    const lens = lensTypes.find(lt => lt.id.toString() === lensId);
    if (frame && lens) {
      setTotalPrice(frame.price * lens.price_multiplier);
    }
  };
  
  const handleSale = async () => {
    if (!frame || !selectedLensType) {
      alert('Missing required information');
      return;
    }
    
    try {
      // Record the sale
      await axios.post('http://localhost:5000/api/sales', {
        shop_id: shopId,
        frame_id: frame.id,
        lens_type_id: selectedLensType,
        quantity: 1,
        unit_price: frame.price,
        total_price: totalPrice
      });
      
      alert('Sale recorded successfully!');
      navigate('/shop-portal/inventory');
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Failed to record sale');
    }
  };
  
  if (isLoading) return <p>Loading...</p>;
  
  if (!frame) {
    return (
      <div className="card">
        <h2>Frame Not Found</h2>
        <p>The requested frame could not be found or is not available in your inventory.</p>
        <button className="button" onClick={() => navigate('/shop-portal/inventory')}>
          Back to Inventory
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h2>Sell Frame</h2>
      
      <div className="card">
        <h3>Frame Details</h3>
        <p><strong>Product ID:</strong> {frame.product_id}</p>
        <p><strong>Name:</strong> {frame.name}</p>
        <p><strong>Description:</strong> {frame.description}</p>
        <p><strong>Base Price:</strong> ${frame.price.toFixed(2)}</p>
        
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Select Lens Type:</label>
          <select
            value={selectedLensType}
            onChange={handleLensChange}
            className="form-control"
          >
            {lensTypes.map(lens => (
              <option key={lens.id} value={lens.id}>
                {lens.name} (x{lens.price_multiplier})
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h4>Sale Summary</h4>
          <p><strong>Total Price:</strong> ${totalPrice.toFixed(2)}</p>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <button className="button" onClick={handleSale}>
            Complete Sale
          </button>
          <button
            className="button secondary"
            onClick={() => navigate('/shop-portal/inventory')}
            style={{ marginLeft: '10px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SalesList = () => {
  const [shopId] = useState(localStorage.getItem('shopId'));
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/sales/${shopId}`);
        setSales(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sales:', error);
        setIsLoading(false);
      }
    };
    
    if (shopId) {
      fetchSales();
    }
  }, [shopId]);
  
  return (
    <div>
      <h2>Sales History</h2>
      
      {isLoading ? (
        <p>Loading sales data...</p>
      ) : sales.length > 0 ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product ID</th>
                <th>Frame</th>
                <th>Lens Type</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Billing Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td>{sale.product_id}</td>
                  <td>{sale.frame_name}</td>
                  <td>{sale.lens_type}</td>
                  <td>${sale.unit_price.toFixed(2)}</td>
                  <td>{sale.quantity}</td>
                  <td>${sale.total_price.toFixed(2)}</td>
                  <td>{sale.billed ? 'Billed' : 'Unbilled'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No sales records found</p>
      )}
    </div>
  );
};

// Main ShopPortal Component
const ShopPortal = () => {
  const navigate = useNavigate();
  const [shopId] = useState(localStorage.getItem('shopId'));

  // Redirect to login if not logged in as shop
  useEffect(() => {
    if (!localStorage.getItem('userType') || localStorage.getItem('userType') !== 'shop' || !shopId) {
      navigate('/login');
    }
  }, [navigate, shopId]);

  if (!shopId) return null;

  return (
    <div className="shop-portal">
      <Routes>
        <Route path="/" element={<ShopDashboard />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/sell/:id" element={<SellFrame />} />
        <Route path="/sales" element={<SalesList />} />
        <Route path="*" element={<Navigate to="/shop-portal" />} />
      </Routes>
    </div>
  );
};

export default ShopPortal;
