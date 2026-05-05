const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    })
  );

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/login
// Simple login — matches email against User table.
// No password hashing (per spec: no auth complexity).
// If user doesn't exist yet, auto-creates them with role = 'Editor'.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { email, name = 'Anonymous', role = 'Editor' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email is required' });
    }

    const validRoles = ['Editor', 'Reviewer', 'Admin'];
    const safeRole   = validRoles.includes(role) ? role : 'Editor';

    let user = await dbGet('SELECT * FROM User WHERE email = ?', [email]);

    if (!user) {
      // First time — auto-register the user
      const result = await dbRun(
        'INSERT INTO User (name, email, role) VALUES (?, ?, ?)',
        [name, email, safeRole]
      );
      user = await dbGet('SELECT * FROM User WHERE id = ?', [result.lastID]);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('POST /api/login error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
