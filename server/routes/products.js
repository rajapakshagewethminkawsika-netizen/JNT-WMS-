const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const list = db.prepare(`
    SELECT id, product_code, film_type, thickness, width, description, created_at
    FROM products ORDER BY product_code
  `).all();
  res.json(list);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(parseInt(req.params.id, 10));
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { product_code, film_type, thickness, width, description } = req.body || {};
  if (!product_code || !film_type || thickness == null || width == null) {
    return res.status(400).json({ error: 'product_code, film_type, thickness, width required' });
  }
  try {
    const r = db.prepare(`
      INSERT INTO products (product_code, film_type, thickness, width, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(product_code, film_type, Number(thickness), Number(width), description || null);
    res.status(201).json({ id: r.lastInsertRowid, product_code, film_type, thickness, width, description: description || null });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Product code already exists' });
    throw e;
  }
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { product_code, film_type, thickness, width, description } = req.body || {};
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`
    UPDATE products SET
      product_code = COALESCE(?, product_code),
      film_type = COALESCE(?, film_type),
      thickness = COALESCE(?, thickness),
      width = COALESCE(?, width),
      description = COALESCE(?, description),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(product_code ?? null, film_type ?? null, thickness != null ? Number(thickness) : null, width != null ? Number(width) : null, description ?? null, id);
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
