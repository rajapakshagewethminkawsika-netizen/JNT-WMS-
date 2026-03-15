const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function nextGdnNumber() {
  const last = db.prepare("SELECT gdn_number FROM gdn ORDER BY id DESC LIMIT 1").get();
  if (!last) return 'GDN-1001';
  const num = parseInt(last.gdn_number.replace(/\D/g, ''), 10) + 1;
  return `GDN-${num}`;
}

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const customerId = req.query.customer_id ? parseInt(req.query.customer_id, 10) : null;
  const today = req.query.today === 'true';

  let where = '';
  const params = [];
  if (customerId) {
    where = ' WHERE g.customer_id = ?';
    params.push(customerId);
  }
  if (today) {
    where += where ? ' AND date(g.dispatched_at) = date(\'now\', \'localtime\')' : ' WHERE date(g.dispatched_at) = date(\'now\', \'localtime\')';
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM gdn g ${where}`).get(...params)?.c ?? 0;
  params.push(limit, (page - 1) * limit);
  const list = db.prepare(`
    SELECT g.id, g.gdn_number, g.customer_id, g.dispatched_at, g.notes, g.created_by,
           c.name as customer_name
    FROM gdn g
    LEFT JOIN customers c ON c.id = g.customer_id
    ${where}
    ORDER BY g.id DESC LIMIT ? OFFSET ?
  `).all(...params);

  res.json({ data: list, total, page, limit });
});

router.get('/today', (req, res) => {
  const list = db.prepare(`
    SELECT g.id, g.gdn_number, g.customer_id, g.dispatched_at, c.name as customer_name
    FROM gdn g
    LEFT JOIN customers c ON c.id = g.customer_id
    WHERE date(g.dispatched_at) = date('now', 'localtime')
    ORDER BY g.id DESC
  `).all();
  let totalRolls = 0, totalKg = 0;
  list.forEach(g => {
    const items = db.prepare('SELECT SUM(rolls) as r, SUM(kg) as k FROM gdn_items WHERE gdn_id = ?').get(g.id);
    g.rolls = items?.r ?? 0;
    g.kg = items?.k ?? 0;
    totalRolls += g.rolls;
    totalKg += g.kg;
  });
  res.json({ data: list, totalRolls, totalKg });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const gdn = db.prepare(`
    SELECT g.*, c.name as customer_name, c.contact_person, c.phone
    FROM gdn g LEFT JOIN customers c ON c.id = g.customer_id WHERE g.id = ?
  `).get(id);
  if (!gdn) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare(`
    SELECT gi.*, p.product_code, p.film_type, p.thickness, p.width
    FROM gdn_items gi JOIN products p ON p.id = gi.product_id WHERE gi.gdn_id = ?
  `).all(id);
  gdn.items = items;
  res.json(gdn);
});

router.post('/', (req, res) => {
  const { customer_id, items, notes } = req.body || {};
  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customer_id and items[] required' });
  }
  const userId = req.user?.id || null;
  const gdnNumber = nextGdnNumber();

  const insertGdn = db.prepare(`
    INSERT INTO gdn (gdn_number, customer_id, created_by, notes) VALUES (?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO gdn_items (gdn_id, product_id, rolls, kg) VALUES (?, ?, ?, ?)
  `);
  const getStock = db.prepare(`
    SELECT id, product_id, location_id, rolls, kg FROM stock WHERE product_id = ? AND rolls > 0 ORDER BY id
  `);
  const updateStock = db.prepare(`
    UPDATE stock SET rolls = rolls - ?, kg = kg - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);

  const run = db.transaction(() => {
    const r = insertGdn.run(gdnNumber, customer_id, userId, notes || null);
    const gdnId = r.lastInsertRowid;
    for (const it of items) {
      const { product_id, rolls, kg } = it;
      if (!product_id || rolls == null || kg == null) continue;
      let remainingRolls = Number(rolls);
      let remainingKg = Number(kg);
      const rows = getStock.all(product_id);
      for (const row of rows) {
        if (remainingRolls <= 0) break;
        const deductRolls = Math.min(remainingRolls, row.rolls);
        const deductKg = Math.min(remainingKg, row.kg);
        if (deductRolls > 0) {
          updateStock.run(deductRolls, deductKg, row.id);
          remainingRolls -= deductRolls;
          remainingKg -= deductKg;
        }
      }
      insertItem.run(gdnId, product_id, Number(rolls), Number(kg));
    }
    return gdnId;
  });

  const gdnId = run();
  res.status(201).json({ id: gdnId, gdn_number: gdnNumber });
});

module.exports = router;
