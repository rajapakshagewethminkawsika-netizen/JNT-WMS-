const express = require('express');
const QRCode = require('qrcode');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/qr/:data', async (req, res) => {
  const data = decodeURIComponent(req.params.data || '');
  if (!data) return res.status(400).send('Missing data');
  try {
    const buf = await QRCode.toBuffer(data, { type: 'png', width: 200, margin: 1 });
    res.setHeader('Content-Type', 'image/png');
    res.send(buf);
  } catch (e) {
    res.status(500).send('QR generation failed');
  }
});

router.get('/label/:rollId', async (req, res) => {
  const rollId = parseInt(req.params.rollId, 10);
  const roll = db.prepare(`
    SELECT r.id, r.roll_barcode, r.kg, r.status, p.product_code, p.film_type, p.thickness, p.width
    FROM rolls r JOIN products p ON p.id = r.product_id WHERE r.id = ?
  `).get(rollId);
  if (!roll) return res.status(404).json({ error: 'Roll not found' });
  const payload = JSON.stringify({
    barcode: roll.roll_barcode,
    product: roll.product_code,
    film: roll.film_type,
    kg: roll.kg,
  });
  try {
    const buf = await QRCode.toBuffer(payload, { type: 'png', width: 256, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.send(buf);
  } catch (e) {
    res.status(500).send('QR generation failed');
  }
});

router.post('/scan', (req, res) => {
  const { barcode, action } = req.body || {};
  if (!barcode) return res.status(400).json({ error: 'barcode required' });
  const roll = db.prepare(`
    SELECT r.*, p.product_code, p.film_type FROM rolls r JOIN products p ON p.id = r.product_id
    WHERE r.roll_barcode = ?
  `).get(barcode.trim());
  if (!roll) return res.status(404).json({ error: 'Roll not found' });
  if (action === 'dispatch' && roll.status === 'in_stock') {
    db.prepare('UPDATE rolls SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('dispatched', roll.id);
    roll.status = 'dispatched';
  }
  res.json(roll);
});

module.exports = router;
