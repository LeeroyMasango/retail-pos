const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add operation to sync queue
router.post('/queue', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { operation, entity_type, entity_id, data } = req.body;

    if (!operation || !entity_type || !data) {
      return res.status(400).json({ error: 'operation, entity_type, and data are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO sync_queue (operation, entity_type, entity_id, data)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      operation,
      entity_type,
      entity_id || null,
      JSON.stringify(data)
    );

    res.status(201).json({
      message: 'Operation queued for sync',
      queueId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue operation', details: error.message });
  }
});

// Get pending sync operations
router.get('/pending', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { limit = 100 } = req.query;

    const stmt = db.prepare(`
      SELECT * FROM sync_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ?
    `);

    const operations = stmt.all(parseInt(limit));

    // Parse JSON data
    const parsedOperations = operations.map(op => ({
      ...op,
      data: JSON.parse(op.data)
    }));

    res.json(parsedOperations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending operations', details: error.message });
  }
});

// Mark operation as synced
router.put('/:id/synced', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE sync_queue
      SET status = 'synced', synced_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    res.json({ message: 'Operation marked as synced' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update operation', details: error.message });
  }
});

// Mark operation as failed
router.put('/:id/failed', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE sync_queue
      SET status = 'failed'
      WHERE id = ?
    `);

    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    res.json({ message: 'Operation marked as failed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update operation', details: error.message });
  }
});

// Bulk sync operations
router.post('/bulk-sync', authenticateToken, (req, res) => {
  const transaction = db.transaction((operations) => {
    const results = { success: 0, failed: 0 };

    for (const op of operations) {
      try {
        const db = getDb();
        // Process the operation based on entity_type
        const data = typeof op.data === 'string' ? JSON.parse(op.data) : op.data;

        switch (op.entity_type) {
          case 'sale':
            // Process sale sync
            // This would typically involve syncing with a central server
            break;
          case 'product':
            // Process product sync
            break;
          case 'inventory':
            // Process inventory sync
            break;
        }

        // Mark as synced
        db.prepare(`
          UPDATE sync_queue
          SET status = 'synced', synced_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(op.id);

        results.success++;
      } catch (error) {
        // Mark as failed
        db.prepare(`
          UPDATE sync_queue
          SET status = 'failed'
          WHERE id = ?
        `).run(op.id);

        results.failed++;
      }
    }

    return results;
  });

  try {
    const db = getDb();
    const { operations } = req.body;

    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({ error: 'operations array is required' });
    }

    const results = transaction(operations);

    res.json({
      message: 'Bulk sync completed',
      ...results
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform bulk sync', details: error.message });
  }
});

// Clear synced operations (admin only)
router.delete('/clear-synced', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { older_than_days = 7 } = req.query;

    const stmt = db.prepare(`
      DELETE FROM sync_queue
      WHERE status = 'synced' 
        AND synced_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(parseInt(older_than_days));

    res.json({
      message: 'Synced operations cleared',
      deleted: result.changes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear operations', details: error.message });
  }
});

// Get sync statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stats = {
      pending: db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?').get('pending').count,
      synced: db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?').get('synced').count,
      failed: db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?').get('failed').count
    };

    const lastSync = db.prepare('SELECT MAX(synced_at) as last_sync FROM sync_queue WHERE status = ?').get('synced');
    stats.last_sync = lastSync?.last_sync;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sync stats', details: error.message });
  }
});

module.exports = router;
