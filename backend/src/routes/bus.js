const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

router.get('/', async (req, res) => {
  try { const { rows } = await req.tenantDb.query('SELECT * FROM buses ORDER BY id DESC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { bus_number, driver_name, driver_phone, route_id, capacity } = req.body;
    if (!bus_number) return res.status(400).json({ error: 'bus_number required' });
    const { rows } = await req.tenantDb.query(
      'INSERT INTO buses (bus_number, driver_name, driver_phone, route_id, capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [bus_number, driver_name || null, driver_phone || null, route_id || null, capacity || 40]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { bus_number, driver_name, driver_phone, route_id, capacity } = req.body;
    const { rows } = await req.tenantDb.query(
      'UPDATE buses SET bus_number=$1, driver_name=$2, driver_phone=$3, route_id=$4, capacity=$5 WHERE id=$6 RETURNING *',
      [bus_number, driver_name, driver_phone, route_id || null, capacity || 40, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await req.tenantDb.query('DELETE FROM buses WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
