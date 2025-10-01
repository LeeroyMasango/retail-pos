const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all products
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { active, category, search } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (active !== undefined) {
      query += ' AND active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR barcode LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name';

    const stmt = db.prepare(query);
    const products = stmt.all(...params);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get product by barcode
router.get('/barcode/:barcode', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM products WHERE barcode = ? AND active = 1');
    const product = stmt.get(req.params.barcode);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const product = stmt.get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// Create product (manager/admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const {
      barcode,
      name,
      description,
      price,
      cost,
      category,
      stock_quantity,
      min_stock_level,
      image_url
    } = req.body;

    if (!barcode || !name || price === undefined) {
      return res.status(400).json({ error: 'Barcode, name, and price are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (barcode, name, description, price, cost, category, stock_quantity, min_stock_level, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      barcode,
      name,
      description || null,
      price,
      cost || null,
      category || null,
      stock_quantity || 0,
      min_stock_level || 10,
      image_url || null
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Product with this barcode already exists' });
    }
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// Update product (manager/admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const {
      barcode,
      name,
      description,
      price,
      cost,
      category,
      stock_quantity,
      min_stock_level,
      image_url,
      active
    } = req.body;

    const updates = [];
    const params = [];

    if (barcode !== undefined) { updates.push('barcode = ?'); params.push(barcode); }
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (cost !== undefined) { updates.push('cost = ?'); params.push(cost); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (stock_quantity !== undefined) { updates.push('stock_quantity = ?'); params.push(stock_quantity); }
    if (min_stock_level !== undefined) { updates.push('min_stock_level = ?'); params.push(min_stock_level); }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const stmt = db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

// Get product categories
router.get('/meta/categories', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND active = 1 ORDER BY category');
    const categories = stmt.all().map(row => row.category);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

module.exports = router;
