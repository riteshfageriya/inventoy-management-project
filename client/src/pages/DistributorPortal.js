import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Distributor Portal Sub-Components
const DistributorDashboard = () => {
  const [shops, setShops] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all shops
        const shopsRes = await axios.get('http://localhost:5000/api/shops');
        setShops(shopsRes.data);
        
        // Get sales from all shops
        const salesPromises = shopsRes.data.map(shop => 
          axios.get(`http://localhost:5000/api/sales/${shop.id}`)
        );
        
        const salesResults = await Promise.all(salesPromises);
        const allSales = salesResults.flatMap(res => res.data);
        setSalesData(allSales);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate dashboard metrics
  const totalShops = shops.length;
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_price, 0);
  const unbilledSales = salesData.filter(sale => !sale.billed).length;
  
  // Group sales by shop for comparison
  const salesByShop = shops.map(shop => {
    const shopSales = salesData.filter(sale => sale.shop_id === shop.id);
    const shopRevenue = shopSales.reduce((sum, sale) => sum + sale.total_price, 0);
    return {
      shopId: shop.id,
      shopName: shop.name,
      salesCount: shopSales.length,
      revenue: shopRevenue
    };
  });

  return (
    <div>
      <h2>Distributor Dashboard</h2>
      
      {isLoading ? (
        <p>Loading dashboard data...</p>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Total Shops</h3>
              <p style={{ fontSize: '2rem' }}>{totalShops}</p>
            </div>
            
            <div className="dashboard-card">
              <h3>Total Sales</h3>
              <p style={{ fontSize: '2rem' }}>{totalSales}</p>
            </div>
            
            <div className="dashboard-card">
              <h3>Total Revenue</h3>
              <p style={{ fontSize: '2rem' }}>${totalRevenue.toFixed(2)}</p>
            </div>
            
            <div className="dashboard-card">
              <h3>Unbilled Sales</h3>
              <p style={{ fontSize: '2rem' }}>{unbilledSales}</p>
            </div>
          </div>

          <div className="card">
            <h3>Shop Performance</h3>
            {salesByShop.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Sales Count</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByShop
                    .sort((a, b) => b.revenue - a.revenue)
                    .map(shop => (
                      <tr key={shop.shopId}>
                        <td>{shop.shopName}</td>
                        <td>{shop.salesCount}</td>
                        <td>${shop.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p>No shop performance data available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [newShopName, setNewShopName] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchShops = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/shops');
      setShops(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchShops();
  }, []);
  
  const handleAddShop = async (e) => {
    e.preventDefault();
    
    if (!newShopName) {
      alert('Shop name is required');
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/shops', {
        name: newShopName,
        address: newShopAddress
      });
      
      setNewShopName('');
      setNewShopAddress('');
      fetchShops();
      alert('Shop added successfully');
    } catch (error) {
      console.error('Error adding shop:', error);
      alert('Failed to add shop');
    }
  };
  
  return (
    <div>
      <h2>Shop Management</h2>
      
      <div className="card">
        <h3>Add New Shop</h3>
        <form onSubmit={handleAddShop}>
          <div className="form-group">
            <label>Shop Name:</label>
            <input
              type="text"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              placeholder="Enter shop name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              value={newShopAddress}
              onChange={(e) => setNewShopAddress(e.target.value)}
              placeholder="Enter shop address"
            />
          </div>
          
          <button type="submit" className="button">
            Add Shop
          </button>
        </form>
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Shops List</h3>
        {isLoading ? (
          <p>Loading shops...</p>
        ) : shops.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => (
                <tr key={shop.id}>
                  <td>{shop.id}</td>
                  <td>{shop.name}</td>
                  <td>{shop.address || 'N/A'}</td>
                  <td>{new Date(shop.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No shops found</p>
        )}
      </div>
    </div>
  );
};

const InventoryManagement = () => {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [frames, setFrames] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shopsRes = await axios.get('http://localhost:5000/api/shops');
        const framesRes = await axios.get('http://localhost:5000/api/frames');
        
        setShops(shopsRes.data);
        setFrames(framesRes.data);
        
        if (shopsRes.data.length > 0) {
          setSelectedShopId(shopsRes.data[0].id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    if (selectedShopId) {
      const fetchInventory = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/inventory/${selectedShopId}`);
          setInventory(response.data);
        } catch (error) {
          console.error('Error fetching inventory:', error);
        }
      };
      
      fetchInventory();
    }
  }, [selectedShopId]);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };
  
  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!csvFile || !selectedShopId) {
      alert('Please select a CSV file and a shop');
      return;
    }
    
    const formData = new FormData();
    formData.append('csvFile', csvFile);
    formData.append('shopId', selectedShopId);
    
    try {
      const response = await axios.post('http://localhost:5000/api/upload-inventory', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert(`Upload successful: ${response.data.message}`);
      setCsvFile(null);
      
      // Refresh inventory after upload
      if (selectedShopId) {
        const invResponse = await axios.get(`http://localhost:5000/api/inventory/${selectedShopId}`);
        setInventory(invResponse.data);
      }
    } catch (error) {
      console.error('Error uploading inventory:', error);
      alert('Failed to upload inventory');
    }
  };
  
  const handleShopChange = (e) => {
    setSelectedShopId(e.target.value);
  };
  
  return (
    <div>
      <h2>Inventory Management</h2>
      
      <div className="card">
        <h3>Upload Inventory CSV</h3>
        <p>Upload a CSV file with the following columns: product_id, name, description, price, quantity</p>
        
        <form onSubmit={handleFileUpload}>
          <div className="form-group">
            <label>Select Shop:</label>
            <select
              value={selectedShopId}
              onChange={handleShopChange}
              required
            >
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>CSV File:</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
            />
          </div>
          
          <button type="submit" className="button" disabled={!csvFile || !selectedShopId}>
            Upload
          </button>
        </form>
      </div>
      
      {selectedShopId && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Current Inventory</h3>
          {inventory.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_id}</td>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No inventory found for this shop</p>
          )}
        </div>
      )}
    </div>
  );
};

const Billing = () => {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(new Date().getFullYear());
  const [billingData, setBillingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/shops');
        setShops(response.data);
        
        if (response.data.length > 0) {
          setSelectedShopId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };
    
    fetchShops();
  }, []);
  
  const handleGenerateBill = async () => {
    if (!selectedShopId) {
      alert('Please select a shop');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/billing/${selectedShopId}`, {
        params: {
          month: billingMonth,
          year: billingYear
        }
      });
      
      setBillingData(response.data);
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to generate bill');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsBilled = async () => {
    if (!billingData || !billingData.sales || billingData.sales.length === 0) {
      alert('No unbilled sales to process');
      return;
    }
    
    const unbilledSales = billingData.sales.filter(sale => !sale.billed);
    
    if (unbilledSales.length === 0) {
      alert('All sales are already marked as billed');
      return;
    }
    
    try {
      await axios.post(`http://localhost:5000/api/billing/${selectedShopId}/mark-billed`, {
        salesIds: unbilledSales.map(sale => sale.id)
      });
      
      // Refresh billing data
      handleGenerateBill();
      alert('Sales marked as billed successfully');
    } catch (error) {
      console.error('Error marking sales as billed:', error);
      alert('Failed to mark sales as billed');
    }
  };
  
  return (
    <div>
      <h2>Billing Management</h2>
      
      <div className="card">
        <h3>Generate Monthly Bill</h3>
        
        <div className="form-group">
          <label>Select Shop:</label>
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
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Month:</label>
            <select
              value={billingMonth}
              onChange={(e) => setBillingMonth(parseInt(e.target.value))}
              className="form-control"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2022, month - 1, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 1 }}>
            <label>Year:</label>
            <select
              value={billingYear}
              onChange={(e) => setBillingYear(parseInt(e.target.value))}
              className="form-control"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleGenerateBill}
          className="button"
          disabled={isLoading || !selectedShopId}
        >
          {isLoading ? 'Generating...' : 'Generate Bill'}
        </button>
      </div>
      
      {billingData && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>
            Monthly Bill - {new Date(billingYear, billingMonth - 1, 1).toLocaleString('default', { month: 'long' })} {billingYear}
          </h3>
          
          <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
            <h4>Summary</h4>
            <p><strong>Total Items Sold:</strong> {billingData.summary.itemCount}</p>
            <p><strong>Total Amount:</strong> ${billingData.summary.totalAmount.toFixed(2)}</p>
          </div>
          
          {billingData.sales.length > 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product ID</th>
                    <th>Frame</th>
                    <th>Lens Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingData.sales.map(sale => (
                    <tr key={sale.id}>
                      <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                      <td>{sale.product_id}</td>
                      <td>{sale.frame_name}</td>
                      <td>{sale.lens_type}</td>
                      <td>{sale.quantity}</td>
                      <td>${sale.total_price.toFixed(2)}</td>
                      <td>{sale.billed ? 'Billed' : 'Unbilled'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={handleMarkAsBilled}
                  className="button"
                  disabled={billingData.sales.every(sale => sale.billed)}
                >
                  Mark as Billed
                </button>
              </div>
            </>
          ) : (
            <p>No sales found for this period</p>
          )}
        </div>
      )}
    </div>
  );
};

// Main DistributorPortal Component
const DistributorPortal = () => {
  const navigate = useNavigate();

  // Redirect to login if not logged in as distributor
  useEffect(() => {
    if (!localStorage.getItem('userType') || localStorage.getItem('userType') !== 'distributor') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="distributor-portal">
      <Routes>
        <Route path="/" element={<DistributorDashboard />} />
        <Route path="/shops" element={<ShopManagement />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="*" element={<Navigate to="/distributor-portal" />} />
      </Routes>
    </div>
  );
};

export default DistributorPortal;
