const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    let q = `SELECT t.*, b.bus_number, b.driver_name, r.route_name
             FROM trips t
             LEFT JOIN buses b ON t.bus_id = b.id
             LEFT JOIN routes r ON t.route_id = r.id WHERE 1=1`;
    const params = [];
    if (start) { params.push(start); q += ` AND t.started_at >= $${params.length}`; }
    if (end) { params.push(end); q += ` AND t.started_at <= $${params.length}`; }
    q += ' ORDER BY t.started_at DESC LIMIT 500';
    const { rows } = await req.tenantDb.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/start', async (req, res) => {
  try {
    const { bus_id, route_id } = req.body;
    if (!bus_id) return res.status(400).json({ error: 'bus_id required' });
    const { rows } = await req.tenantDb.query(
      'INSERT INTO trips (bus_id, route_id, status) VALUES ($1,$2,$3) RETURNING *',
      [bus_id, route_id || null, 'in_progress']
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/end', async (req, res) => {
  try {
    const { distance_km } = req.body;
    const { rows } = await req.tenantDb.query(
      `UPDATE trips SET ended_at=NOW(), distance_km=$1, status='completed' WHERE id=$2 RETURNING *`,
      [distance_km || 0, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await req.tenantDb.query('DELETE FROM trips WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// CSV export
router.get('/export/csv', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      `SELECT t.id, b.bus_number, b.driver_name, r.route_name, t.started_at, t.ended_at, t.distance_km, t.status
       FROM trips t LEFT JOIN buses b ON t.bus_id=b.id LEFT JOIN routes r ON t.route_id=r.id
       ORDER BY t.started_at DESC LIMIT 1000`
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=trips-report.csv');
    let csv = 'ID,Bus,Driver,Route,Started,Ended,Distance (km),Status\n';
    rows.forEach(r => {
      csv += `${r.id},"${r.bus_number || ''}","${r.driver_name || ''}","${r.route_name || ''}",${r.started_at || ''},${r.ended_at || ''},${r.distance_km || 0},${r.status || ''}\n`;
    });
    res.send('\uFEFF' + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
