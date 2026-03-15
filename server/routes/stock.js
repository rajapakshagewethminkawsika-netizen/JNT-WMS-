const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/summary', (req, res) => {
  const total = db.prepare(`
    SELECT COALESCE(SUM(rolls), 0) as total_rolls, COALESCE(SUM(kg), 0) as total_kg
    FROM stock
  `).get();
  res.json(total);
});

router.get('/by-product', (req, res) => {
  const list = db.prepare(`
    SELECT s.product_id, p.product_code, p.film_type, p.thickness, p.width,
           SUM(s.rolls) as rolls, SUM(s.kg) as kg
    FROM stock s
    JOIN products p ON p.id = s.product_id
    GROUP BY s.product_id
    HAVING rolls > 0 OR kg > 0
    ORDER BY p.product_code
  `).all();
  res.json(list);
});

router.get('/by-location', (req, res) => {
  const zone = req.query.zone;
  const rack = req.query.rack;
  const level = req.query.level;

  let where = 'WHERE s.rolls > 0 OR s.kg > 0';
  const params = [];
  if (zone) {
    where += ' AND wl.zone = ?';
    params.push(zone);
  }
  if (rack) {
    where += ' AND wl.rack = ?';
    params.push(rack);
  }
  if (level) {
    where += ' AND wl.level = ?';
    params.push(level);
  }
  params.push(req.query.limit ? Math.min(500, parseInt(req.query.limit, 10)) : 500);

  const list = db.prepare(`
    SELECT s.id, s.product_id, s.location_id, s.rolls, s.kg,
           p.product_code, p.film_type, p.thickness, p.width,
           wl.zone, wl.rack, wl.level
    FROM stock s
    JOIN products p ON p.id = s.product_id
    JOIN warehouse_locations wl ON wl.id = s.location_id
    ${where}
    ORDER BY wl.zone, wl.rack, wl.level, p.product_code
    LIMIT ?
  `).all(...params);
  res.json(list);
});

router.get('/low-stock', (req, res) => {
  const threshold = Math.max(0, parseInt(req.query.threshold, 10) || 10);
  const list = db.prepare(`
    SELECT s.product_id, p.product_code, p.film_type, p.thickness, p.width,
           SUM(s.rolls) as rolls, SUM(s.kg) as kg
    FROM stock s
    JOIN products p ON p.id = s.product_id
    GROUP BY s.product_id
    HAVING SUM(s.rolls) < ?
    ORDER BY SUM(s.rolls) ASC
  `).all(threshold);
  res.json(list);
});

module.exports = router;
