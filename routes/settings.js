const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all settings
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT key, value, updated_at FROM settings');
    const settings = stmt.all();

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = {
        value: setting.value,
        updated_at: setting.updated_at
      };
    });

    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
});

// Get specific setting
router.get('/:key', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT key, value, updated_at FROM settings WHERE key = ?');
    const setting = stmt.get(req.params.key);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch setting', details: error.message });
  }
});

// Update setting (manager/admin only)
router.put('/:key', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  try {
    const db = getDb();
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Validate specific settings
    const key = req.params.key;
    
    if (key === 'tax_rate') {
      const taxRate = parseFloat(value);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
        return res.status(400).json({ error: 'Tax rate must be between 0 and 1' });
      }
    }

    if (key === 'low_stock_threshold') {
      const threshold = parseInt(value);
      if (isNaN(threshold) || threshold < 0) {
        return res.status(400).json({ error: 'Low stock threshold must be a non-negative integer' });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(key, value, value);

    res.json({ message: 'Setting updated successfully', key, value });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update setting', details: error.message });
  }
});

// Update multiple settings (manager/admin only)
router.post('/bulk-update', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const transaction = db.transaction((settings) => {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    const updated = [];

    for (const [key, value] of Object.entries(settings)) {
      // Validate specific settings
      if (key === 'tax_rate') {
        const taxRate = parseFloat(value);
        if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
          throw new Error('Tax rate must be between 0 and 1');
        }
      }

      if (key === 'low_stock_threshold') {
        const threshold = parseInt(value);
        if (isNaN(threshold) || threshold < 0) {
          throw new Error('Low stock threshold must be a non-negative integer');
        }
      }

      stmt.run(key, value, value);
      updated.push(key);
    }

    return updated;
  });

  try {
    const db = getDb();
    const updated = transaction(req.body);
    res.json({ message: 'Settings updated successfully', updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

// Reset settings to defaults (admin only)
router.post('/reset', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const db = getDb();
    const defaultSettings = {
      tax_rate: '0.10',
      currency: 'USD',
      currency_symbol: '$',
      receipt_header: 'Retail Store',
      receipt_footer: 'Thank you for your business!',
      low_stock_threshold: '10',
      receipt_format: 'standard'
    };

    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    for (const [key, value] of Object.entries(defaultSettings)) {
      stmt.run(key, value, value);
    }

    res.json({ message: 'Settings reset to defaults', settings: defaultSettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset settings', details: error.message });
  }
});

module.exports = router;
