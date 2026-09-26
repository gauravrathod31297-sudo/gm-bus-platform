const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const masterDb = require('../config/database');
const { generateAnnouncements, calculateETA, haversine } = require('../services/voiceService');

router.use(authenticate, tenantMiddleware);

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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/bus/:id', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      `SELECT * FROM live_locations WHERE bus_id=$1 ORDER BY updated_at DESC LIMIT 1`,
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/eta', async (req, res) => {
  try {
    const { bus_id, stop_id } = req.body;
    const bus = await req.tenantDb.query('SELECT * FROM live_locations WHERE bus_id=$1 ORDER BY updated_at DESC LIMIT 1', [bus_id]);
    const stop = await req.tenantDb.query('SELECT * FROM stops WHERE id=$1', [stop_id]);
    if (!bus.rows[0] || !stop.rows[0]) return res.status(404).json({ error: 'Not found' });
    const b = bus.rows[0], s = stop.rows[0];
    const eta = calculateETA(b.lat, b.lng, s.lat, s.lng, b.speed);
    res.json({ bus_id, stop_id, eta_seconds: Math.round(eta), eta_minutes: Math.round(eta / 60), distance_meters: Math.round(haversine(b.lat, b.lng, s.lat, s.lng)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Announcement — Primary + Hindi + English (based on client language)
router.post('/announcement', async (req, res) => {
  try {
    const { stop_name, stop_name_mr, stop_name_gu, stop_name_hi } = req.body;
    if (!stop_name) return res.status(400).json({ error: 'stop_name required' });

    // Get client preferred_language
    const clientId = req.user.client_id;
    const { rows: clients } = await masterDb.query(
      'SELECT preferred_language FROM clients WHERE id=$1',
      [clientId]
    );
    const primaryLang = clients[0]?.preferred_language || 'en';

    const results = await generateAnnouncements(
      { stop_name, stop_name_mr, stop_name_gu, stop_name_hi },
      primaryLang
    );

    res.json({ success: true, primary_language: primaryLang, announcements: results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/parse-link', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });
    let lat, lng;
    const m1 = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m1) { lat = parseFloat(m1[1]); lng = parseFloat(m1[2]); }
    if (!lat) {
      const m2 = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m2) { lat = parseFloat(m2[1]); lng = parseFloat(m2[2]); }
    }
    if (!lat) {
      const m3 = url.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m3) { lat = parseFloat(m3[1]); lng = parseFloat(m3[2]); }
    }
    if (!lat || !lng) return res.status(400).json({ error: 'Invalid Google Maps link' });
    res.json({ success: true, lat, lng });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
