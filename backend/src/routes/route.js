const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

// ═══════ ROUTES ═══════
router.get('/', async (req, res) => {
  try { const { rows } = await req.tenantDb.query('SELECT * FROM routes ORDER BY id DESC'); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM routes WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const stops = await req.tenantDb.query('SELECT * FROM stops WHERE route_id=$1 ORDER BY stop_order ASC', [req.params.id]);
    res.json({ ...rows[0], stops: stops.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const {
      route_name, start_point, end_point,
      start_lat, start_lng, end_lat, end_lng,
      distance_km, estimated_minutes,
    } = req.body;
    if (!route_name) return res.status(400).json({ error: 'route_name required' });
    const { rows } = await req.tenantDb.query(
      `INSERT INTO routes
        (route_name, start_point, end_point, start_lat, start_lng, end_lat, end_lng, distance_km, estimated_minutes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [route_name, start_point || null, end_point || null,
       start_lat || null, start_lng || null, end_lat || null, end_lng || null,
       distance_km || null, estimated_minutes || null]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      route_name, start_point, end_point,
      start_lat, start_lng, end_lat, end_lng,
      distance_km, estimated_minutes,
    } = req.body;
    const { rows } = await req.tenantDb.query(
      `UPDATE routes SET
        route_name=$1, start_point=$2, end_point=$3,
        start_lat=$4, start_lng=$5, end_lat=$6, end_lng=$7,
        distance_km=$8, estimated_minutes=$9
       WHERE id=$10 RETURNING *`,
      [route_name, start_point || null, end_point || null,
       start_lat || null, start_lng || null, end_lat || null, end_lng || null,
       distance_km || null, estimated_minutes || null, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM stops WHERE route_id=$1', [req.params.id]);
    await req.tenantDb.query('DELETE FROM routes WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════ STOPS ═══════
router.get('/:id/stops', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM stops WHERE route_id=$1 ORDER BY stop_order ASC', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/stops', async (req, res) => {
  try {
    const { stop_name, stop_name_mr, stop_name_gu, stop_name_hi, lat, lng, stop_order, announcement_text } = req.body;
    if (!stop_name) return res.status(400).json({ error: 'stop_name required' });
    const { rows } = await req.tenantDb.query(
      `INSERT INTO stops (route_id, stop_name, stop_name_mr, stop_name_gu, stop_name_hi, lat, lng, stop_order, announcement_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, stop_name, stop_name_mr || stop_name, stop_name_gu || stop_name,
       stop_name_hi || stop_name, lat || null, lng || null, stop_order || 1, announcement_text || null]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/stops/:stopId', async (req, res) => {
  try {
    const { stop_name, stop_name_mr, stop_name_gu, stop_name_hi, lat, lng, stop_order, announcement_text } = req.body;
    const { rows } = await req.tenantDb.query(
      `UPDATE stops SET stop_name=$1, stop_name_mr=$2, stop_name_gu=$3, stop_name_hi=$4,
        lat=$5, lng=$6, stop_order=$7, announcement_text=$8
       WHERE id=$9 AND route_id=$10 RETURNING *`,
      [stop_name, stop_name_mr, stop_name_gu, stop_name_hi, lat || null, lng || null,
       stop_order, announcement_text || null, req.params.stopId, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/stops/:stopId', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM stops WHERE id=$1 AND route_id=$2', [req.params.stopId, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
