const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const { generateAnnouncement, calculateETA } = require('../services/voiceService');

router.use(authenticate, tenantMiddleware);

// GET /api/tracking/live - सर्व live buses
router.get('/live', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      `SELECT ll.*, b.bus_number, b.driver_name, r.route_name
       FROM live_locations ll
       JOIN buses b ON ll.bus_id = b.id
       LEFT JOIN routes r ON b.route_id = r.id
       ORDER BY ll.updated_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tracking/bus/:id - एका bus ची latest location
router.get('/bus/:id', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      `SELECT * FROM live_locations 
       WHERE bus_id=$1 
       ORDER BY updated_at DESC LIMIT 1`,
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tracking/eta - ETA calculate
router.post('/eta', async (req, res) => {
  try {
    const { bus_id, stop_id } = req.body;

    const bus = await req.tenantDb.query(
      'SELECT * FROM live_locations WHERE bus_id=$1 ORDER BY updated_at DESC LIMIT 1',
      [bus_id]
    );

    const stop = await req.tenantDb.query(
      'SELECT * FROM stops WHERE id=$1',
      [stop_id]
    );

    if (!bus.rows[0] || !stop.rows[0]) {
      return res.status(404).json({ error: 'Bus or stop not found' });
    }

    const b = bus.rows[0];
    const s = stop.rows[0];

    const etaSeconds = calculateETA(b.lat, b.lng, s.lat, s.lng, b.speed);

    res.json({
      bus_id,
      stop_id,
      eta_seconds: Math.round(etaSeconds),
      eta_minutes: Math.round(etaSeconds / 60),
      distance_meters: Math.round(
        require('../services/voiceService').haversine(b.lat, b.lng, s.lat, s.lng)
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tracking/announcement - voice announcement generate
router.post('/announcement', async (req, res) => {
  try {
    const { stop_name, language } = req.body;

    if (!stop_name) {
      return res.status(400).json({ error: 'stop_name required' });
    }

    const result = await generateAnnouncement(stop_name, language || 'mr');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
