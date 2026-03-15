const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const totalInventory = db.prepare(`
    SELECT COALESCE(SUM(rolls), 0) as total_rolls, COALESCE(SUM(kg), 0) as total_kg FROM stock
  `).get();

  const todayGrn = db.prepare(`
    SELECT COALESCE(SUM(gi.rolls), 0) as rolls, COALESCE(SUM(gi.kg), 0) as kg
    FROM grn_items gi JOIN grn g ON g.id = gi.grn_id
    WHERE date(g.received_at) = date('now', 'localtime')
  `).get();

  const todayGdn = db.prepare(`
    SELECT COALESCE(SUM(gi.rolls), 0) as rolls, COALESCE(SUM(gi.kg), 0) as kg
    FROM gdn_items gi JOIN gdn g ON g.id = gi.gdn_id
    WHERE date(g.dispatched_at) = date('now', 'localtime')
  `).get();

  const lowStock = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT product_id FROM stock GROUP BY product_id HAVING SUM(rolls) < 10
    )
  `).get();

  const fastMoving = db.prepare(`
    SELECT p.product_code, p.film_type, SUM(gi.rolls) as rolls
    FROM gdn_items gi JOIN gdn g ON g.id = gi.gdn_id JOIN products p ON p.id = gi.product_id
    WHERE date(g.dispatched_at) >= date('now', '-30 days')
    GROUP BY gi.product_id ORDER BY rolls DESC LIMIT 10
  `).all();

  const recentGrn = db.prepare(`
    SELECT g.id, g.grn_number, g.received_at, s.name as supplier_name,
           (SELECT SUM(rolls) FROM grn_items WHERE grn_id = g.id) as rolls
    FROM grn g LEFT JOIN suppliers s ON s.id = g.supplier_id
    ORDER BY g.id DESC LIMIT 5
  `).all();

  const recentGdn = db.prepare(`
    SELECT g.id, g.gdn_number, g.dispatched_at, c.name as customer_name,
           (SELECT SUM(rolls) FROM gdn_items WHERE gdn_id = g.id) as rolls
    FROM gdn g LEFT JOIN customers c ON c.id = g.customer_id
    ORDER BY g.id DESC LIMIT 5
  `).all();

  res.json({
    totalInventory: {
      rolls: totalInventory.total_rolls,
      kg: totalInventory.total_kg,
    },
    todayReceived: { rolls: todayGrn.rolls, kg: todayGrn.kg },
    todayDispatched: { rolls: todayGdn.rolls, kg: todayGdn.kg },
    lowStockCount: lowStock.count,
    fastMoving,
    recentGrn,
    recentGdn,
  });
});

module.exports = router;
