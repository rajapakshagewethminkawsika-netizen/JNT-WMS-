const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const list = db.prepare(`
    SELECT id, supplier_code, name, contact_person, phone, address, created_at
    FROM suppliers ORDER BY name
  `).all();
  res.json(list);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(parseInt(req.params.id, 10));
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { supplier_code, name, contact_person, phone, address } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare(`
    INSERT INTO suppliers (supplier_code, name, contact_person, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `).run(supplier_code || null, name, contact_person || null, phone || null, address || null);
  res.status(201).json({ id: r.lastInsertRowid, supplier_code, name, contact_person, phone, address });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { supplier_code, name, contact_person, phone, address } = req.body || {};
  const existing = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`
    UPDATE suppliers SET
      supplier_code = COALESCE(?, supplier_code),
      name = COALESCE(?, name),
      contact_person = COALESCE(?, contact_person),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(supplier_code ?? null, name ?? null, contact_person ?? null, phone ?? null, address ?? null, id);
  res.json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
