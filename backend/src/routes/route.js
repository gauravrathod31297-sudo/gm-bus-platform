const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

// List all routes
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM routes ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single route with stops
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM routes WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const stops = await req.tenantDb.query(
      'SELECT * FROM stops WHERE route_id=$1 ORDER BY stop_order ASC', [req.params.id]
    );
    res.json({ ...rows[0], stops: stops.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create route
router.post('/', async (req, res) => {
  try {
    const { route_name, start_point, end_point } = req.body;
    if (!route_name) return res.status(400).json({ error: 'route_name required' });
    const { rows } = await req.tenantDb.query(
      'INSERT INTO routes (route_name, start_point, end_point) VALUES ($1,$2,$3) RETURNING *',
      [route_name, start_point || null, end_point || null]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update route
router.put('/:id', async (req, res) => {
  try {
    const { route_name, start_point, end_point } = req.body;
    const { rows } = await req.tenantDb.query(
      'UPDATE routes SET route_name=$1, start_point=$2, end_point=$3 WHERE id=$4 RETURNING *',
      [route_name, start_point, end_point, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete route
router.delete('/:id', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM routes WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ⭐ Get stops for a route
router.get('/:id/stops', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      'SELECT * FROM stops WHERE route_id=$1 ORDER BY stop_order ASC', [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ⭐ Create stop under a route (accepts stop_name_hi)
router.post('/:id/stops', async (req, res) => {
  try {
    const { stop_name, stop_name_mr, stop_name_gu, stop_name_hi, lat, lng, stop_order } = req.body;
    if (!stop_name) return res.status(400).json({ error: 'stop_name required' });
    if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });

    const { rows } = await req.tenantDb.query(
      `INSERT INTO stops
         (route_id, stop_name, stop_name_mr, stop_name_gu, stop_name_hi, lat, lng, stop_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.params.id,
        stop_name,
        stop_name_mr || stop_name,
        stop_name_gu || stop_name,
        stop_name_hi || stop_name,
        lat, lng,
        stop_order || 1,
      ]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
