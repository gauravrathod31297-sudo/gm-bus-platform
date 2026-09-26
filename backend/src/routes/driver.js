const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

// GET all drivers
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM drivers ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET one
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM drivers WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, license_no, license_expiry, blood_group, address, photo_url, shift, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const { rows } = await req.tenantDb.query(
      `INSERT INTO drivers (name, phone, email, license_no, license_expiry, blood_group, address, photo_url, shift, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, phone||null, email||null, license_no||null, license_expiry||null,
       blood_group||null, address||null, photo_url||null, shift||'day', status||'active']
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, license_no, license_expiry, blood_group, address, photo_url, shift, status } = req.body;
    const { rows } = await req.tenantDb.query(
      `UPDATE drivers SET name=$1, phone=$2, email=$3, license_no=$4, license_expiry=$5,
       blood_group=$6, address=$7, photo_url=$8, shift=$9, status=$10 WHERE id=$11 RETURNING *`,
      [name, phone||null, email||null, license_no||null, license_expiry||null,
       blood_group||null, address||null, photo_url||null, shift||'day', status||'active', req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM drivers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
