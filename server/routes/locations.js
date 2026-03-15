const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const list = db.prepare(`
    SELECT id, zone, rack, level FROM warehouse_locations ORDER BY zone, rack, level
  `).all();
  res.json(list);
});

router.post('/', (req, res) => {
  const { zone, rack, level } = req.body || {};
  if (!zone || !rack || !level) return res.status(400).json({ error: 'zone, rack, level required' });
  try {
    const r = db.prepare(`
      INSERT INTO warehouse_locations (zone, rack, level) VALUES (?, ?, ?)
    `).run(String(zone).trim(), String(rack).trim(), String(level).trim());
    res.status(201).json({ id: r.lastInsertRowid, zone, rack, level });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Location already exists' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const hasStock = db.prepare('SELECT 1 FROM stock WHERE location_id = ? AND (rolls > 0 OR kg > 0)').get(id);
  if (hasStock) return res.status(400).json({ error: 'Location has stock; cannot delete' });
  const r = db.prepare('DELETE FROM warehouse_locations WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
