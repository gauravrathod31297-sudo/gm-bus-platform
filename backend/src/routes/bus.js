const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      `SELECT b.*, r.route_name FROM buses b 
       LEFT JOIN routes r ON b.route_id = r.id
       ORDER BY b.id DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single bus with stops
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      `SELECT b.*, r.route_name FROM buses b 
       LEFT JOIN routes r ON b.route_id = r.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bus not found' });
    
    // Get stops for this bus's route
    let stops = [];
    if (rows[0].route_id) {
      const stopsRes = await req.tenantDb.query(
        'SELECT * FROM stops WHERE route_id = $1 ORDER BY stop_order',
        [rows[0].route_id]
      );
      stops = stopsRes.rows;
    }
    
    res.json({ ...rows[0], stops });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get stops for bus route
router.get('/:id/stops', async (req, res) => {
  try {
    const bus = await req.tenantDb.query('SELECT route_id FROM buses WHERE id=$1', [req.params.id]);
    if (!bus.rows[0]?.route_id) return res.json([]);
    
    const stops = await req.tenantDb.query(
      'SELECT * FROM stops WHERE route_id=$1 ORDER BY stop_order',
      [bus.rows[0].route_id]
    );
    res.json(stops.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { bus_number, driver_name, driver_phone, route_id, capacity } = req.body;
    const { rows } = await req.tenantDb.query(
      `INSERT INTO buses (bus_number, driver_name, driver_phone, route_id, capacity)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [bus_number, driver_name, driver_phone, route_id, capacity || 40]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { bus_number, driver_name, driver_phone, route_id, capacity, status } = req.body;
    const { rows } = await req.tenantDb.query(
      `UPDATE buses SET bus_number=$1, driver_name=$2, driver_phone=$3, 
       route_id=$4, capacity=$5, status=$6 WHERE id=$7 RETURNING *`,
      [bus_number, driver_name, driver_phone, route_id, capacity, status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM buses WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
