const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get inventory overview
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const lowStockThreshold = db.prepare('SELECT value FROM settings WHERE key = ?').get('low_stock_threshold');
    const threshold = parseInt(lowStockThreshold?.value || '10');

    const stats = {
      total_products: db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get().count,
      total_stock_value: db.prepare('SELECT SUM(stock_quantity * price) as value FROM products WHERE active = 1').get().value || 0,
      low_stock_count: db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock_quantity <= ?').get(threshold).count,
      out_of_stock_count: db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock_quantity = 0').get().count
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory overview', details: error.message });
  }
});

// Get low stock products
router.get('/low-stock', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const lowStockThreshold = db.prepare('SELECT value FROM settings WHERE key = ?').get('low_stock_threshold');
    const threshold = parseInt(lowStockThreshold?.value || '10');

    const stmt = db.prepare(`
      SELECT * FROM products 
      WHERE active = 1 AND stock_quantity <= ? AND stock_quantity > 0
      ORDER BY stock_quantity ASC
    `);
    const products = stmt.all(threshold);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch low stock products', details: error.message });
  }
});

// Get out of stock products
router.get('/out-of-stock', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM products WHERE active = 1 AND stock_quantity = 0 ORDER BY name');
    const products = stmt.all();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch out of stock products', details: error.message });
  }
});

// Get inventory alerts
router.get('/alerts', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const lowStockThreshold = db.prepare('SELECT value FROM settings WHERE key = ?').get('low_stock_threshold');
    const threshold = parseInt(lowStockThreshold?.value || '10');

    const alerts = [];

    // Out of stock alerts
    const outOfStock = db.prepare('SELECT * FROM products WHERE active = 1 AND stock_quantity = 0').all();
    outOfStock.forEach(product => {
      alerts.push({
        type: 'out_of_stock',
        severity: 'critical',
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        current_stock: 0,
        message: `${product.name} is out of stock`
      });
    });

    // Low stock alerts
    const lowStock = db.prepare(`
      SELECT * FROM products 
      WHERE active = 1 AND stock_quantity > 0 AND stock_quantity <= ?
    `).all(threshold);
    lowStock.forEach(product => {
      alerts.push({
        type: 'low_stock',
        severity: 'warning',
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        current_stock: product.stock_quantity,
        threshold: threshold,
        message: `${product.name} stock is low (${product.stock_quantity} remaining)`
      });
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory alerts', details: error.message });
  }
});

// Restock product (manager/admin only)
router.post('/restock', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const { product_id, quantity, notes } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid product_id and positive quantity are required' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const quantityBefore = product.stock_quantity;
    const quantityAfter = quantityBefore + quantity;

    // Update stock
    db.prepare('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(quantityAfter, product_id);

    // Record inventory transaction
    db.prepare(`
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, quantity_before, quantity_after, user_id, notes)
      VALUES (?, 'restock', ?, ?, ?, ?, ?)
    `).run(product_id, quantity, quantityBefore, quantityAfter, req.user.id, notes || null);

    res.json({
      message: 'Product restocked successfully',
      product_id,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      quantity_added: quantity
    });
  } catch (error) {
    console.error('Restock error:', error);
    res.status(500).json({ error: 'Failed to restock product', details: error.message });
  }
});

// Adjust inventory (manager/admin only)
router.post('/adjust', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const { product_id, new_quantity, notes } = req.body;

    if (!product_id || new_quantity === undefined || new_quantity < 0) {
      return res.status(400).json({ error: 'Valid product_id and non-negative new_quantity are required' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const quantityBefore = product.stock_quantity;
    const quantityChange = new_quantity - quantityBefore;

    // Update stock
    db.prepare('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(new_quantity, product_id);

    // Record inventory transaction
    db.prepare(`
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, quantity_before, quantity_after, user_id, notes)
      VALUES (?, 'adjustment', ?, ?, ?, ?, ?)
    `).run(product_id, quantityChange, quantityBefore, new_quantity, req.user.id, notes || null);

    res.json({
      message: 'Inventory adjusted successfully',
      product_id,
      quantity_before: quantityBefore,
      quantity_after: new_quantity,
      quantity_change: quantityChange
    });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    res.status(500).json({ error: 'Failed to adjust inventory', details: error.message });
  }
});

// Get inventory transactions
router.get('/transactions', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { product_id, transaction_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT it.*, p.name as product_name, p.barcode, u.username
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      query += ' AND it.product_id = ?';
      params.push(product_id);
    }

    if (transaction_type) {
      query += ' AND it.transaction_type = ?';
      params.push(transaction_type);
    }

    if (start_date) {
      query += ' AND it.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND it.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY it.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const stmt = db.prepare(query);
    const transactions = stmt.all(...params);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory transactions', details: error.message });
  }
});

// Get fast-moving items
router.get('/fast-moving', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { days = 30, limit = 10 } = req.query;

    const stmt = db.prepare(`
      SELECT 
        p.id,
        p.barcode,
        p.name,
        p.category,
        p.price,
        p.stock_quantity,
        SUM(si.quantity) as total_sold,
        COUNT(DISTINCT si.sale_id) as transaction_count
      FROM products p
      INNER JOIN sale_items si ON p.id = si.product_id
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed' 
        AND s.created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?
    `);

    const items = stmt.all(parseInt(days), parseInt(limit));

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fast-moving items', details: error.message });
  }
});

module.exports = router;
