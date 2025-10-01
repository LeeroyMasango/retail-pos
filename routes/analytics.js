const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get daily sales summary
router.get('/daily-summary', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const summary = {
      date: targetDate,
      total_revenue: 0,
      total_transactions: 0,
      total_items_sold: 0,
      average_transaction_value: 0,
      tax_collected: 0,
      discounts_given: 0
    };

    const salesStmt = db.prepare(`
      SELECT 
        COUNT(*) as transaction_count,
        SUM(total) as total_revenue,
        SUM(tax_amount) as tax_collected,
        SUM(discount_amount) as discounts_given
      FROM sales
      WHERE DATE(created_at) = ? AND status = 'completed'
    `);

    const salesData = salesStmt.get(targetDate);

    if (salesData) {
      summary.total_transactions = salesData.transaction_count;
      summary.total_revenue = salesData.total_revenue || 0;
      summary.tax_collected = salesData.tax_collected || 0;
      summary.discounts_given = salesData.discounts_given || 0;
      summary.average_transaction_value = summary.total_transactions > 0 
        ? summary.total_revenue / summary.total_transactions 
        : 0;
    }

    const itemsStmt = db.prepare(`
      SELECT SUM(si.quantity) as total_items
      FROM sale_items si
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) = ? AND s.status = 'completed'
    `);

    const itemsData = itemsStmt.get(targetDate);
    summary.total_items_sold = itemsData?.total_items || 0;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily summary', details: error.message });
  }
});

// Get sales by date range
router.get('/sales-by-date', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const stmt = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(total) as total_revenue,
        SUM(tax_amount) as tax_collected,
        AVG(total) as average_transaction_value
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const data = stmt.all(start_date, end_date);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales data', details: error.message });
  }
});

// Get sales by category
router.get('/sales-by-category', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        COALESCE(p.category, 'Uncategorized') as category,
        COUNT(DISTINCT si.sale_id) as transaction_count,
        SUM(si.quantity) as items_sold,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      INNER JOIN products p ON si.product_id = p.id
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed'
    `;

    const params = [];

    if (start_date) {
      query += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY p.category ORDER BY total_revenue DESC';

    const stmt = db.prepare(query);
    const data = stmt.all(...params);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category data', details: error.message });
  }
});

// Get top selling products
router.get('/top-products', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date, limit = 10 } = req.query;

    let query = `
      SELECT 
        p.id,
        p.barcode,
        p.name,
        p.category,
        p.price,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_revenue,
        COUNT(DISTINCT si.sale_id) as transaction_count
      FROM sale_items si
      INNER JOIN products p ON si.product_id = p.id
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed'
    `;

    const params = [];

    if (start_date) {
      query += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY p.id ORDER BY total_sold DESC LIMIT ?';
    params.push(parseInt(limit));

    const stmt = db.prepare(query);
    const data = stmt.all(...params);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top products', details: error.message });
  }
});

// Get hourly sales pattern
router.get('/hourly-pattern', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as transaction_count,
        SUM(total) as total_revenue
      FROM sales
      WHERE DATE(created_at) = ? AND status = 'completed'
      GROUP BY hour
      ORDER BY hour
    `);

    const data = stmt.all(targetDate);

    // Fill in missing hours with zero values
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      transaction_count: 0,
      total_revenue: 0
    }));

    data.forEach(row => {
      hourlyData[row.hour] = row;
    });

    res.json(hourlyData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hourly pattern', details: error.message });
  }
});

// Get sales by payment method
router.get('/payment-methods', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        COALESCE(payment_method, 'Not Specified') as payment_method,
        COUNT(*) as transaction_count,
        SUM(total) as total_revenue
      FROM sales
      WHERE status = 'completed'
    `;

    const params = [];

    if (start_date) {
      query += ' AND DATE(created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(created_at) <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY payment_method ORDER BY total_revenue DESC';

    const stmt = db.prepare(query);
    const data = stmt.all(...params);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment method data', details: error.message });
  }
});

// Export analytics data to CSV
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { type, start_date, end_date } = req.query;

    if (!type) {
      return res.status(400).json({ error: 'Export type is required' });
    }

    let data, fields;

    switch (type) {
      case 'sales':
        const salesStmt = db.prepare(`
          SELECT 
            s.transaction_id,
            s.created_at,
            s.subtotal,
            s.tax_amount,
            s.discount_amount,
            s.total,
            s.payment_method,
            s.status,
            u.username
          FROM sales s
          LEFT JOIN users u ON s.user_id = u.id
          WHERE DATE(s.created_at) BETWEEN ? AND ?
          ORDER BY s.created_at DESC
        `);
        data = salesStmt.all(start_date, end_date);
        fields = ['transaction_id', 'created_at', 'subtotal', 'tax_amount', 'discount_amount', 'total', 'payment_method', 'status', 'username'];
        break;

      case 'products':
        const productsStmt = db.prepare('SELECT * FROM products WHERE active = 1');
        data = productsStmt.all();
        fields = ['id', 'barcode', 'name', 'category', 'price', 'cost', 'stock_quantity', 'min_stock_level'];
        break;

      case 'inventory':
        const inventoryStmt = db.prepare(`
          SELECT 
            it.created_at,
            p.barcode,
            p.name,
            it.transaction_type,
            it.quantity_change,
            it.quantity_before,
            it.quantity_after,
            u.username,
            it.notes
          FROM inventory_transactions it
          LEFT JOIN products p ON it.product_id = p.id
          LEFT JOIN users u ON it.user_id = u.id
          WHERE DATE(it.created_at) BETWEEN ? AND ?
          ORDER BY it.created_at DESC
        `);
        data = inventoryStmt.all(start_date, end_date);
        fields = ['created_at', 'barcode', 'name', 'transaction_type', 'quantity_change', 'quantity_before', 'quantity_after', 'username', 'notes'];
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `${type}_export_${Date.now()}.csv`;
    const filepath = path.join(exportsDir, filename);

    fs.writeFileSync(filepath, csv);

    res.json({
      message: 'Export completed successfully',
      filename,
      url: `/exports/${filename}`,
      records: data.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data', details: error.message });
  }
});

// Get dashboard overview
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Today's sales
    const todaySales = db.prepare(`
      SELECT 
        COUNT(*) as transaction_count,
        SUM(total) as total_revenue
      FROM sales
      WHERE DATE(created_at) = ? AND status = 'completed'
    `).get(today);

    // This month's sales
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const monthSales = db.prepare(`
      SELECT 
        COUNT(*) as transaction_count,
        SUM(total) as total_revenue
      FROM sales
      WHERE DATE(created_at) >= ? AND status = 'completed'
    `).get(monthStart);

    // Inventory stats
    const lowStockThreshold = db.prepare('SELECT value FROM settings WHERE key = ?').get('low_stock_threshold');
    const threshold = parseInt(lowStockThreshold?.value || '10');

    const inventoryStats = {
      total_products: db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get().count,
      low_stock_count: db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock_quantity <= ? AND stock_quantity > 0').get(threshold).count,
      out_of_stock_count: db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock_quantity = 0').get().count
    };

    // Top products today
    const topProducts = db.prepare(`
      SELECT 
        p.name,
        SUM(si.quantity) as total_sold
      FROM sale_items si
      INNER JOIN products p ON si.product_id = p.id
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) = ? AND s.status = 'completed'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `).all(today);

    res.json({
      today: {
        date: today,
        transaction_count: todaySales?.transaction_count || 0,
        total_revenue: todaySales?.total_revenue || 0
      },
      month: {
        start_date: monthStart,
        transaction_count: monthSales?.transaction_count || 0,
        total_revenue: monthSales?.total_revenue || 0
      },
      inventory: inventoryStats,
      top_products: topProducts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

module.exports = router;
