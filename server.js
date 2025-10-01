require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./database/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/receipts', express.static(path.join(__dirname, 'receipts')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Initialize database and start server
(async () => {
  try {
    const db = await initSchema();
    
    // Check if database has data, if not, initialize with sample data
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    if (userCount.count === 0) {
      console.log('Database empty, initializing with sample data...');
      const bcrypt = require('bcryptjs');
      
      // Create users
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.prepare('INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)').run('admin', hashedPassword, 'admin', 'System Administrator', 'admin@retailstore.com');
      db.prepare('INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)').run('cashier1', await bcrypt.hash('cashier123', 10), 'cashier', 'John Doe', 'john@retailstore.com');
      db.prepare('INSERT INTO users (username, password, role, full_name, email) VALUES (?, ?, ?, ?, ?)').run('manager1', await bcrypt.hash('manager123', 10), 'manager', 'Jane Smith', 'jane@retailstore.com');
      
      // Create sample products
      const sampleProducts = [
        ['8901234567890', 'Coca Cola 500ml', 'Refreshing cola drink', 1.99, 1.20, 'Beverages', 100, 20],
        ['8901234567891', 'Lays Chips Classic', 'Crispy potato chips', 2.49, 1.50, 'Snacks', 80, 15],
        ['8901234567892', 'Milk 1L', 'Fresh whole milk', 3.99, 2.50, 'Dairy', 50, 10],
        ['8901234567893', 'White Bread', 'Soft white bread loaf', 2.99, 1.80, 'Bakery', 40, 10],
        ['8901234567894', 'Eggs 12 pack', 'Farm fresh eggs', 4.99, 3.00, 'Dairy', 60, 15],
        ['8901234567895', 'Orange Juice 1L', 'Pure orange juice', 5.49, 3.50, 'Beverages', 45, 10],
        ['8901234567896', 'Chocolate Bar', 'Milk chocolate bar', 1.49, 0.80, 'Snacks', 120, 25],
        ['8901234567897', 'Bananas 1kg', 'Fresh bananas', 2.99, 1.50, 'Produce', 70, 15],
        ['8901234567898', 'Apples 1kg', 'Red delicious apples', 3.99, 2.20, 'Produce', 55, 12],
        ['8901234567899', 'Butter 250g', 'Salted butter', 4.49, 2.80, 'Dairy', 35, 8],
      ];
      
      const productStmt = db.prepare('INSERT INTO products (barcode, name, description, price, cost, category, stock_quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      sampleProducts.forEach(product => productStmt.run(...product));
      
      console.log('✓ Sample data initialized');
    }
    
    app.listen(PORT, () => {
      console.log(`POS Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();
