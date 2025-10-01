const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user (admin only in production)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, full_name, email } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    if (!['admin', 'manager', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, full_name, email)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, hashedPassword, role, full_name || null, email || null);

    res.status(201).json({
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1');
    const user = stmt.get(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT id, username, role, full_name, email, created_at FROM users WHERE id = ?');
    const user = stmt.get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Get all users (admin/manager only)
router.get('/users', authenticateToken, (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const db = getDb();
    const stmt = db.prepare('SELECT id, username, role, full_name, email, active, created_at FROM users ORDER BY created_at DESC');
    const users = stmt.all();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

module.exports = router;
