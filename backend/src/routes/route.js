const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

// GET /api/route
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      'SELECT * FROM routes ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/route
router.post('/', async (req, res) => {
  try {
    const {
      route_name, start_point, end_point,
      start_lat, start_lng, end_lat, end_lng,
      distance_km, estimated_minutes,
    } = req.body;

    const { rows } = await req.tenantDb.query(
      `INSERT INTO routes 
       (route_name, start_point, end_point, start_lat, start_lng, 
        end_lat, end_lng, distance_km, estimated_minutes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [route_name, start_point, end_point, start_lat, start_lng,
       end_lat, end_lng, distance_km, estimated_minutes]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/route/:id/stops
router.get('/:id/stops', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      'SELECT * FROM stops WHERE route_id=$1 ORDER BY stop_order',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/route/:id/stops
router.post('/:id/stops', async (req, res) => {
  try {
    const {
      stop_name, stop_name_mr, stop_name_gu,
      lat, lng, stop_order, announcement_text,
    } = req.body;

    const { rows } = await req.tenantDb.query(
      `INSERT INTO stops 
       (route_id, stop_name, stop_name_mr, stop_name_gu, 
        lat, lng, stop_order, announcement_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, stop_name, stop_name_mr, stop_name_gu,
       lat, lng, stop_order, announcement_text]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/route/:id
router.delete('/:id', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM routes WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
