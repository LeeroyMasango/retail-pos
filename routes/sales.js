const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { generateReceipt } = require('../utils/receiptGenerator');

const router = express.Router();

// Create a new sale
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { items, payment_method, notes, discount_amount = 0 } = req.body;

      if (!items || items.length === 0) {
        throw new Error('Sale must contain at least one item');
      }

      // Get tax rate from settings
      const taxRateSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('tax_rate');
      const taxRate = parseFloat(taxRateSetting?.value || '0.10');

      // Calculate totals
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.product_id);

        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`);
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        processedItems.push({
          product_id: product.id,
          barcode: product.barcode,
          product_name: product.name,
          quantity: item.quantity,
          unit_price: product.price,
          subtotal: itemSubtotal,
          stock_before: product.stock_quantity
        });
      }

      const taxAmount = (subtotal - discount_amount) * taxRate;
      const total = subtotal - discount_amount + taxAmount;
      const transactionId = uuidv4();

      // Insert sale
      const saleStmt = db.prepare(`
        INSERT INTO sales (transaction_id, user_id, subtotal, tax_amount, tax_rate, discount_amount, total, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const saleResult = saleStmt.run(
        transactionId,
        req.user.id,
        subtotal,
        taxAmount,
        taxRate,
        discount_amount,
        total,
        payment_method || null,
        notes || null
      );

      const saleId = saleResult.lastInsertRowid;
      console.log('Created sale with ID:', saleId);

      // Insert sale items and update inventory
      const saleItemStmt = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, barcode, product_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');

      const inventoryTxnStmt = db.prepare(`
        INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_id, user_id)
        VALUES (?, 'sale', ?, ?, ?, ?, ?)
      `);

      for (const item of processedItems) {
        saleItemStmt.run(
          saleId,
          item.product_id,
          item.barcode,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.subtotal
        );

        updateStockStmt.run(item.quantity, item.product_id);

        const quantityAfter = item.stock_before - item.quantity;
        inventoryTxnStmt.run(
          item.product_id,
          -item.quantity,
          item.stock_before,
          quantityAfter,
          saleId,
          req.user.id
        );
      }

    res.status(201).json({
      message: 'Sale completed successfully',
      saleId,
      transactionId,
      subtotal,
      taxAmount,
      taxRate,
      discount_amount,
      total,
      items: processedItems
    });
  } catch (error) {
    console.error('Sale error:', error);
    res.status(500).json({ error: 'Failed to process sale', details: error.message });
  }
});

// Get all sales
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date, status, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT s.*, u.username, u.full_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ' AND s.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND s.created_at <= ?';
      params.push(end_date);
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const stmt = db.prepare(query);
    const sales = stmt.all(...params);

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales', details: error.message });
  }
});

// Get sale by ID with items
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const saleStmt = db.prepare(`
      SELECT s.*, u.username, u.full_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `);
    const sale = saleStmt.get(req.params.id);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const itemsStmt = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?');
    const items = itemsStmt.all(req.params.id);

    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sale', details: error.message });
  }
});

// Get sale by transaction ID
router.get('/transaction/:transactionId', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const saleStmt = db.prepare(`
      SELECT s.*, u.username, u.full_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.transaction_id = ?
    `);
    const sale = saleStmt.get(req.params.transactionId);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const itemsStmt = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?');
    const items = itemsStmt.all(sale.id);

    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sale', details: error.message });
  }
});

// Generate receipt for a sale
router.get('/:id/receipt', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { format = 'pdf' } = req.query;

    const saleStmt = db.prepare(`
      SELECT s.*, u.username, u.full_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `);
    const sale = saleStmt.get(req.params.id);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const itemsStmt = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?');
    const items = itemsStmt.all(req.params.id);

    const settings = {};
    const settingsStmt = db.prepare('SELECT key, value FROM settings');
    settingsStmt.all().forEach(row => {
      settings[row.key] = row.value;
    });

    const receiptData = { ...sale, items, settings };
    const receiptPath = await generateReceipt(receiptData, format);

    res.json({
      message: 'Receipt generated successfully',
      path: receiptPath,
      url: `/receipts/${receiptPath.split('/').pop()}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate receipt', details: error.message });
  }
});

// Refund a sale (manager/admin only)
router.post('/:id/refund', authenticateToken, (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const db = getDb();
    const saleId = req.params.id;
    const userId = req.user.id;

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (sale.status === 'refunded') {
      return res.status(400).json({ error: 'Sale already refunded' });
    }

    // Update sale status
    db.prepare('UPDATE sales SET status = ? WHERE id = ?').run('refunded', saleId);

    // Get sale items
    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);

    // Restore inventory
    const updateStockStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
    const inventoryTxnStmt = db.prepare(`
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_id, user_id)
      VALUES (?, 'return', ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.product_id);
      const quantityBefore = product.stock_quantity;
      const quantityAfter = quantityBefore + item.quantity;

      updateStockStmt.run(item.quantity, item.product_id);
      inventoryTxnStmt.run(item.product_id, item.quantity, quantityBefore, quantityAfter, saleId, userId);
    }

    res.json({ message: 'Sale refunded successfully' });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to refund sale', details: error.message });
  }
});

module.exports = router;
