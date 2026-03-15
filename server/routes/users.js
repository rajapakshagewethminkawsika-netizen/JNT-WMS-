const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, role, full_name, created_at
    FROM users ORDER BY id
  `).all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { username, password, role, full_name } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password and role required' });
  }
  const allowed = ['admin', 'warehouse_manager', 'storekeeper'];
  if (!allowed.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const r = db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name)
      VALUES (?, ?, ?, ?)
    `).run(username, hash, role, full_name || null);
    res.status(201).json({ id: r.lastInsertRowid, username, role, full_name: full_name || null });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already exists' });
    throw e;
  }
});

router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { password, role, full_name } = req.body || {};
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updates = [];
  const params = [];
  if (password) {
    updates.push('password_hash = ?');
    params.push(bcrypt.hashSync(password, 10));
  }
  if (role) {
    if (!['admin', 'warehouse_manager', 'storekeeper'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    updates.push('role = ?');
    params.push(role);
  }
  if (full_name !== undefined) {
    updates.push('full_name = ?');
    params.push(full_name);
  }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const r = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
});

module.exports = router;
