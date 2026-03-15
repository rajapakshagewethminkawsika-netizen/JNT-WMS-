const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
  const search = (req.query.search || '').trim();
  const offset = (page - 1) * limit;

  let where = '';
  const params = [];
  if (search) {
    where = ' WHERE customer_code LIKE ? OR name LIKE ? OR contact_person LIKE ? OR phone LIKE ?';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM customers ${where}`).get(...params)?.c ?? 0;
  params.push(limit, offset);
  const list = db.prepare(`
    SELECT id, customer_code, name, contact_person, phone, address, created_at
    FROM customers ${where}
    ORDER BY name LIMIT ? OFFSET ?
  `).all(...params);

  res.json({ data: list, total, page, limit });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(parseInt(req.params.id, 10));
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { customer_code, name, contact_person, phone, address } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare(`
    INSERT INTO customers (customer_code, name, contact_person, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `).run(customer_code || null, name, contact_person || null, phone || null, address || null);
  res.status(201).json({ id: r.lastInsertRowid, customer_code, name, contact_person, phone, address });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { customer_code, name, contact_person, phone, address } = req.body || {};
  const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`
    UPDATE customers SET
      customer_code = COALESCE(?, customer_code),
      name = COALESCE(?, name),
      contact_person = COALESCE(?, contact_person),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(customer_code ?? null, name ?? null, contact_person ?? null, phone ?? null, address ?? null, id);
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
