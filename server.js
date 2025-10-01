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
    await initSchema();
    app.listen(PORT, () => {
      console.log(`POS Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();
