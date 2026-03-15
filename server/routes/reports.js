const express = require('express');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/stock', (req, res) => {
  const byLocation = req.query.by_location === 'true';
  if (byLocation) {
    const list = db.prepare(`
      SELECT wl.zone, wl.rack, wl.level, p.product_code, p.film_type, p.thickness, p.width, s.rolls, s.kg
      FROM stock s
      JOIN products p ON p.id = s.product_id
      JOIN warehouse_locations wl ON wl.id = s.location_id
      WHERE s.rolls > 0 OR s.kg > 0
      ORDER BY wl.zone, wl.rack, wl.level, p.film_type
    `).all();
    return res.json(list);
  }
  const list = db.prepare(`
    SELECT p.product_code, p.film_type, p.thickness, p.width, SUM(s.rolls) as rolls, SUM(s.kg) as kg
    FROM stock s JOIN products p ON p.id = s.product_id
    GROUP BY s.product_id ORDER BY p.film_type
  `).all();
  res.json(list);
});

router.get('/supplier', (req, res) => {
  const supplierId = req.query.supplier_id ? parseInt(req.query.supplier_id, 10) : null;
  let sql = `
    SELECT g.grn_number, g.received_at, s.name as supplier_name, gi.rolls, gi.kg, p.product_code, p.film_type
    FROM grn g
    JOIN suppliers s ON s.id = g.supplier_id
    JOIN grn_items gi ON gi.grn_id = g.id
    JOIN products p ON p.id = gi.product_id
  `;
  const params = [];
  if (supplierId) {
    sql += ' WHERE g.supplier_id = ?';
    params.push(supplierId);
  }
  sql += ' ORDER BY g.received_at DESC LIMIT 1000';
  const list = db.prepare(sql).all(...params);
  res.json(list);
});

router.get('/customer', (req, res) => {
  const customerId = req.query.customer_id ? parseInt(req.query.customer_id, 10) : null;
  let sql = `
    SELECT g.gdn_number, g.dispatched_at, c.name as customer_name, gi.rolls, gi.kg, p.product_code, p.film_type
    FROM gdn g
    JOIN customers c ON c.id = g.customer_id
    JOIN gdn_items gi ON gi.gdn_id = g.id
    JOIN products p ON p.id = gi.product_id
  `;
  const params = [];
  if (customerId) {
    sql += ' WHERE g.customer_id = ?';
    params.push(customerId);
  }
  sql += ' ORDER BY g.dispatched_at DESC LIMIT 1000';
  const list = db.prepare(sql).all(...params);
  res.json(list);
});

router.get('/movement', (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  let sql = `
    SELECT 'GRN' as type, g.grn_number as ref, g.received_at as at, s.name as party, gi.rolls, gi.kg, p.product_code
    FROM grn g JOIN suppliers s ON s.id = g.supplier_id
    JOIN grn_items gi ON gi.grn_id = g.id JOIN products p ON p.id = gi.product_id
    WHERE 1=1
  `;
  const params = [];
  if (from) {
    sql += ' AND date(g.received_at) >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND date(g.received_at) <= ?';
    params.push(to);
  }
  sql += `
    UNION ALL
    SELECT 'GDN', g.gdn_number, g.dispatched_at, c.name, gi.rolls, gi.kg, p.product_code
    FROM gdn g JOIN customers c ON c.id = g.customer_id
    JOIN gdn_items gi ON gi.gdn_id = g.id JOIN products p ON p.id = gi.product_id
    WHERE 1=1
  `;
  if (from) {
    sql += ' AND date(g.dispatched_at) >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND date(g.dispatched_at) <= ?';
    params.push(to);
  }
  sql += ' ORDER BY at DESC LIMIT 500';
  const list = db.prepare(sql).all(...params);
  res.json(list);
});

router.get('/fast-moving', (req, res) => {
  const days = Math.max(1, parseInt(req.query.days, 10) || 30);
  const list = db.prepare(`
    SELECT p.product_code, p.film_type, SUM(gi.rolls) as rolls, SUM(gi.kg) as kg
    FROM gdn_items gi
    JOIN gdn g ON g.id = gi.gdn_id
    JOIN products p ON p.id = gi.product_id
    WHERE date(g.dispatched_at) >= date('now', ?)
    GROUP BY gi.product_id
    ORDER BY rolls DESC
    LIMIT 20
  `).all(`-${days} days`);
  res.json(list);
});

function exportExcel(data, sheetName) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

router.get('/export/stock', (req, res) => {
  const list = db.prepare(`
    SELECT p.product_code, p.film_type, p.thickness, p.width, SUM(s.rolls) as rolls, SUM(s.kg) as kg
    FROM stock s JOIN products p ON p.id = s.product_id GROUP BY s.product_id ORDER BY p.film_type
  `).all();
  const buf = exportExcel(list, 'Stock');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=stock-report.xlsx');
  res.send(buf);
});

router.get('/export/supplier', (req, res) => {
  const list = db.prepare(`
    SELECT g.grn_number, g.received_at, s.name as supplier_name, gi.rolls, gi.kg, p.product_code, p.film_type
    FROM grn g JOIN suppliers s ON s.id = g.supplier_id
    JOIN grn_items gi ON gi.grn_id = g.id JOIN products p ON p.id = gi.product_id
    ORDER BY g.received_at DESC LIMIT 5000
  `).all();
  const buf = exportExcel(list, 'Supplier');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=supplier-report.xlsx');
  res.send(buf);
});

router.get('/export/customer', (req, res) => {
  const list = db.prepare(`
    SELECT g.gdn_number, g.dispatched_at, c.name as customer_name, gi.rolls, gi.kg, p.product_code, p.film_type
    FROM gdn g JOIN customers c ON c.id = g.customer_id
    JOIN gdn_items gi ON gi.gdn_id = g.id JOIN products p ON p.id = gi.product_id
    ORDER BY g.dispatched_at DESC LIMIT 5000
  `).all();
  const buf = exportExcel(list, 'Customer');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=customer-report.xlsx');
  res.send(buf);
});

router.get('/export/movement', (req, res) => {
  const list = db.prepare(`
    SELECT 'GRN' as type, g.grn_number as ref, g.received_at as at, s.name as party, gi.rolls, gi.kg, p.product_code
    FROM grn g JOIN suppliers s ON s.id = g.supplier_id JOIN grn_items gi ON gi.grn_id = g.id JOIN products p ON p.id = gi.product_id
    UNION ALL
    SELECT 'GDN', g.gdn_number, g.dispatched_at, c.name, gi.rolls, gi.kg, p.product_code
    FROM gdn g JOIN customers c ON c.id = g.customer_id JOIN gdn_items gi ON gi.gdn_id = g.id JOIN products p ON p.id = gi.product_id
    ORDER BY at DESC LIMIT 5000
  `).all();
  const buf = exportExcel(list, 'Movement');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=movement-report.xlsx');
  res.send(buf);
});

router.get('/pdf/stock', (req, res) => {
  const list = db.prepare(`
    SELECT p.product_code, p.film_type, p.thickness, p.width, SUM(s.rolls) as rolls, SUM(s.kg) as kg
    FROM stock s JOIN products p ON p.id = s.product_id GROUP BY s.product_id ORDER BY p.film_type
  `).all();
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=stock-report.pdf');
  doc.pipe(res);
  doc.fontSize(18).text('JNT Suppliers - Stock Report', 50, 50);
  doc.fontSize(10).text(new Date().toISOString().slice(0, 10), 50, 75);
  let y = 100;
  doc.fontSize(9);
  doc.text('Product Code', 50, y);
  doc.text('Film Type', 150, y);
  doc.text('Thickness', 250, y);
  doc.text('Width', 320, y);
  doc.text('Rolls', 380, y);
  doc.text('KG', 430, y);
  y += 20;
  list.forEach(row => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    doc.text(String(row.product_code || ''), 50, y);
    doc.text(String(row.film_type || ''), 150, y);
    doc.text(String(row.thickness ?? ''), 250, y);
    doc.text(String(row.width ?? ''), 320, y);
    doc.text(String(row.rolls ?? 0), 380, y);
    doc.text(String(row.kg ?? 0), 430, y);
    y += 18;
  });
  doc.end();
});

module.exports = router;
