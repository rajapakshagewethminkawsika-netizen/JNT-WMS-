const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function nextGrnNumber() {
  const last = db.prepare("SELECT grn_number FROM grn ORDER BY id DESC LIMIT 1").get();
  if (!last) return 'GRN-1001';
  const num = parseInt(last.grn_number.replace(/\D/g, ''), 10) + 1;
  return `GRN-${num}`;
}

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const supplierId = req.query.supplier_id ? parseInt(req.query.supplier_id, 10) : null;
  const today = req.query.today === 'true';

  let where = '';
  const params = [];
  if (supplierId) {
    where = ' WHERE g.supplier_id = ?';
    params.push(supplierId);
  }
  if (today) {
    where += where ? ' AND date(g.received_at) = date(\'now\', \'localtime\')' : ' WHERE date(g.received_at) = date(\'now\', \'localtime\')';
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM grn g ${where}`).get(...params)?.c ?? 0;
  params.push(limit, (page - 1) * limit);
  const list = db.prepare(`
    SELECT g.id, g.grn_number, g.supplier_id, g.received_at, g.notes, g.created_by,
           s.name as supplier_name
    FROM grn g
    LEFT JOIN suppliers s ON s.id = g.supplier_id
    ${where}
    ORDER BY g.id DESC LIMIT ? OFFSET ?
  `).all(...params);

  res.json({ data: list, total, page, limit });
});

router.get('/today', (req, res) => {
  const list = db.prepare(`
    SELECT g.id, g.grn_number, g.supplier_id, g.received_at, s.name as supplier_name
    FROM grn g
    LEFT JOIN suppliers s ON s.id = g.supplier_id
    WHERE date(g.received_at) = date('now', 'localtime')
    ORDER BY g.id DESC
  `).all();
  let totalRolls = 0, totalKg = 0;
  list.forEach(g => {
    const items = db.prepare('SELECT SUM(rolls) as r, SUM(kg) as k FROM grn_items WHERE grn_id = ?').get(g.id);
    g.rolls = items?.r ?? 0;
    g.kg = items?.k ?? 0;
    totalRolls += g.rolls;
    totalKg += g.kg;
  });
  res.json({ data: list, totalRolls, totalKg });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const grn = db.prepare(`
    SELECT g.*, s.name as supplier_name, s.contact_person, s.phone
    FROM grn g LEFT JOIN suppliers s ON s.id = g.supplier_id WHERE g.id = ?
  `).get(id);
  if (!grn) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare(`
    SELECT gi.*, p.product_code, p.film_type, p.thickness, p.width,
           wl.zone, wl.rack, wl.level
    FROM grn_items gi
    JOIN products p ON p.id = gi.product_id
    JOIN warehouse_locations wl ON wl.id = gi.location_id
    WHERE gi.grn_id = ?
  `).all(id);
  grn.items = items;
  res.json(grn);
});

router.post('/', (req, res) => {
  const { supplier_id, items, notes } = req.body || {};
  if (!supplier_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'supplier_id and items[] required' });
  }
  const userId = req.user?.id || null;
  const grnNumber = nextGrnNumber();

  const insertGrn = db.prepare(`
    INSERT INTO grn (grn_number, supplier_id, created_by, notes) VALUES (?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO grn_items (grn_id, product_id, location_id, rolls, kg) VALUES (?, ?, ?, ?, ?)
  `);
  const upsertStock = db.prepare(`
    INSERT INTO stock (product_id, location_id, rolls, kg) VALUES (?, ?, ?, ?)
    ON CONFLICT(product_id, location_id) DO UPDATE SET
      rolls = rolls + excluded.rolls,
      kg = kg + excluded.kg,
      updated_at = CURRENT_TIMESTAMP
  `);

  const run = db.transaction(() => {
    const r = insertGrn.run(grnNumber, supplier_id, userId, notes || null);
    const grnId = r.lastInsertRowid;
    for (const it of items) {
      const { product_id, location_id, rolls, kg } = it;
      if (!product_id || !location_id || rolls == null || kg == null) continue;
      insertItem.run(grnId, product_id, location_id, Number(rolls), Number(kg));
      upsertStock.run(product_id, location_id, Number(rolls), Number(kg));
    }
    return grnId;
  });

  const grnId = run();
  res.status(201).json({ id: grnId, grn_number: grnNumber });
});

module.exports = router;
