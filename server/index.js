const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Initialize express app
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, '../database/inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Shops table
  db.run(`CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Frames table
  db.run(`CREATE TABLE IF NOT EXISTS frames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Shop inventory table
  db.run(`CREATE TABLE IF NOT EXISTS shop_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    frame_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, frame_id),
    FOREIGN KEY (shop_id) REFERENCES shops (id),
    FOREIGN KEY (frame_id) REFERENCES frames (id)
  )`);

  // Lens types table
  db.run(`CREATE TABLE IF NOT EXISTS lens_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_multiplier REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    frame_id INTEGER NOT NULL,
    lens_type_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    billed BOOLEAN DEFAULT 0,
    FOREIGN KEY (shop_id) REFERENCES shops (id),
    FOREIGN KEY (frame_id) REFERENCES frames (id),
    FOREIGN KEY (lens_type_id) REFERENCES lens_types (id)
  )`);

  // Insert default lens types
  db.run(`INSERT OR IGNORE INTO lens_types (name, price_multiplier) VALUES ('Regular', 1.0)`);
  db.run(`INSERT OR IGNORE INTO lens_types (name, price_multiplier) VALUES ('Premium', 1.5)`);
  db.run(`INSERT OR IGNORE INTO lens_types (name, price_multiplier) VALUES ('Pro', 2.0)`);
}

// File upload configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes

// Shops API
app.get('/api/shops', (req, res) => {
  db.all('SELECT * FROM shops', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/shops', (req, res) => {
  const { name, address } = req.body;
  db.run('INSERT INTO shops (name, address) VALUES (?, ?)', [name, address], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, address });
  });
});

// Frames API
app.get('/api/frames', (req, res) => {
  db.all('SELECT * FROM frames', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/frames', (req, res) => {
  const { product_id, name, description, price } = req.body;
  db.run('INSERT INTO frames (product_id, name, description, price) VALUES (?, ?, ?, ?)', 
    [product_id, name, description, price], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, product_id, name, description, price });
    });
});

// Shop Inventory API
app.get('/api/inventory/:shopId', (req, res) => {
  const { shopId } = req.params;
  db.all(`
    SELECT si.id, f.product_id, f.name, f.description, f.price, si.quantity
    FROM shop_inventory si
    JOIN frames f ON si.frame_id = f.id
    WHERE si.shop_id = ?
  `, [shopId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/inventory', (req, res) => {
  const { shop_id, frame_id, quantity } = req.body;
  
  // Check if inventory entry already exists
  db.get('SELECT * FROM shop_inventory WHERE shop_id = ? AND frame_id = ?', [shop_id, frame_id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      // Update existing inventory
      db.run('UPDATE shop_inventory SET quantity = quantity + ? WHERE shop_id = ? AND frame_id = ?',
        [quantity, shop_id, frame_id],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ id: row.id, shop_id, frame_id, quantity: row.quantity + quantity });
        });
    } else {
      // Create new inventory entry
      db.run('INSERT INTO shop_inventory (shop_id, frame_id, quantity) VALUES (?, ?, ?)',
        [shop_id, frame_id, quantity],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ id: this.lastID, shop_id, frame_id, quantity });
        });
    }
  });
});

// Sales API
app.get('/api/sales/:shopId', (req, res) => {
  const { shopId } = req.params;
  db.all(`
    SELECT s.id, f.product_id, f.name as frame_name, lt.name as lens_type, s.quantity, s.unit_price, s.total_price, s.sale_date, s.billed
    FROM sales s
    JOIN frames f ON s.frame_id = f.id
    JOIN lens_types lt ON s.lens_type_id = lt.id
    WHERE s.shop_id = ?
    ORDER BY s.sale_date DESC
  `, [shopId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/sales', (req, res) => {
  const { shop_id, frame_id, lens_type_id, quantity, unit_price, total_price } = req.body;
  
  db.run(`
    INSERT INTO sales (shop_id, frame_id, lens_type_id, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [shop_id, frame_id, lens_type_id, quantity, unit_price, total_price],
  function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Update inventory
    db.run('UPDATE shop_inventory SET quantity = quantity - ? WHERE shop_id = ? AND frame_id = ?',
      [quantity, shop_id, frame_id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, shop_id, frame_id, lens_type_id, quantity, unit_price, total_price });
      });
  });
});

// Lens types API
app.get('/api/lens-types', (req, res) => {
  db.all('SELECT * FROM lens_types', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// CSV Upload for frame inventory
app.post('/api/upload-inventory', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const shopId = req.body.shopId;
  if (!shopId) {
    return res.status(400).json({ error: 'Shop ID is required' });
  }

  const filePath = req.file.path;
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const rows = data.split('\n');
    // Skip header row
    const headerRow = rows[0].split(',');
    
    // Find indexes for product_id, name, description, price
    const productIdIndex = headerRow.findIndex(h => h.trim().toLowerCase() === 'product_id');
    const nameIndex = headerRow.findIndex(h => h.trim().toLowerCase() === 'name');
    const descriptionIndex = headerRow.findIndex(h => h.trim().toLowerCase() === 'description');
    const priceIndex = headerRow.findIndex(h => h.trim().toLowerCase() === 'price');
    const quantityIndex = headerRow.findIndex(h => h.trim().toLowerCase() === 'quantity');

    if (productIdIndex === -1 || nameIndex === -1 || priceIndex === -1) {
      return res.status(400).json({ error: 'CSV must contain product_id, name, and price columns' });
    }

    // Process each row (skip header)
    let processed = 0;
    let errors = [];

    // Use transaction for better performance and consistency
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const columns = rows[i].split(',');
        const productId = columns[productIdIndex].trim();
        const name = columns[nameIndex].trim();
        const description = descriptionIndex !== -1 ? columns[descriptionIndex].trim() : '';
        const price = parseFloat(columns[priceIndex].trim());
        const quantity = quantityIndex !== -1 ? parseInt(columns[quantityIndex].trim()) : 0;
        
        if (!productId || !name || isNaN(price)) {
          errors.push(`Row ${i + 1}: Invalid data`);
          continue;
        }
        
        // Insert or update frame
        db.run('INSERT OR IGNORE INTO frames (product_id, name, description, price) VALUES (?, ?, ?, ?)',
          [productId, name, description, price],
          function(err) {
            if (err) {
              errors.push(`Row ${i + 1}: ${err.message}`);
              return;
            }
            
            // Get frame ID (either newly inserted or existing)
            db.get('SELECT id FROM frames WHERE product_id = ?', [productId], (err, frame) => {
              if (err || !frame) {
                errors.push(`Row ${i + 1}: Could not find frame with product ID ${productId}`);
                return;
              }
              
              // Add to shop inventory
              db.run(`
                INSERT INTO shop_inventory (shop_id, frame_id, quantity)
                VALUES (?, ?, ?)
                ON CONFLICT (shop_id, frame_id) DO UPDATE SET quantity = quantity + ?
              `, [shopId, frame.id, quantity, quantity],
              function(err) {
                if (err) {
                  errors.push(`Row ${i + 1}: Could not update inventory - ${err.message}`);
                }
                processed++;
              });
            });
          });
      }

      db.run('COMMIT', err => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Processed ${processed} frames`, errors });
      });
    });
  });
});

// Billing API
app.get('/api/billing/:shopId', (req, res) => {
  const { shopId } = req.params;
  const month = req.query.month || new Date().getMonth() + 1;
  const year = req.query.year || new Date().getFullYear();
  
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}-01`;
  
  db.all(`
    SELECT s.id, f.product_id, f.name as frame_name, lt.name as lens_type, 
           s.quantity, s.unit_price, s.total_price, s.sale_date, s.billed
    FROM sales s
    JOIN frames f ON s.frame_id = f.id
    JOIN lens_types lt ON s.lens_type_id = lt.id
    WHERE s.shop_id = ? 
      AND s.sale_date >= ? 
      AND s.sale_date < ?
    ORDER BY s.sale_date
  `, [shopId, startDate, endDate], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const totalAmount = rows.reduce((sum, sale) => sum + sale.total_price, 0);
    const itemCount = rows.reduce((sum, sale) => sum + sale.quantity, 0);
    
    res.json({
      sales: rows,
      summary: {
        totalAmount,
        itemCount,
        month,
        year
      }
    });
  });
});

app.post('/api/billing/:shopId/mark-billed', (req, res) => {
  const { shopId } = req.params;
  const { salesIds } = req.body;
  
  if (!salesIds || !Array.isArray(salesIds) || salesIds.length === 0) {
    return res.status(400).json({ error: 'Sales IDs are required' });
  }
  
  const placeholders = salesIds.map(() => '?').join(',');
  
  db.run(`
    UPDATE sales SET billed = 1
    WHERE id IN (${placeholders}) AND shop_id = ?
  `, [...salesIds, shopId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ updated: this.changes });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
