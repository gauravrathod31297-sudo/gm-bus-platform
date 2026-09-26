const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

// GET /api/announcements/settings
router.get('/settings', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM announcement_settings WHERE id=1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/announcements/settings
router.put('/settings', async (req, res) => {
  try {
    const { trigger_seconds, mode, languages, voice_speed, voice_volume, repeat_count } = req.body;
    await req.tenantDb.query(
      `UPDATE announcement_settings SET trigger_seconds=$1, mode=$2,
              languages=$3::jsonb, voice_speed=$4, voice_volume=$5,
              repeat_count=$6, updated_at=NOW() WHERE id=1`,
      [trigger_seconds, mode, JSON.stringify(languages),
       voice_speed, voice_volume, repeat_count]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/announcements — list all
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/announcements — create
router.post('/', async (req, res) => {
  try {
    const { stop_id, text_mr, text_gu, text_en, text_hi, audio_url } = req.body;
    const { rows } = await req.tenantDb.query(
      `INSERT INTO announcements (stop_id, text_mr, text_gu, text_en, text_hi, audio_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [stop_id, text_mr, text_gu, text_en, text_hi, audio_url]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/announcements/:id
router.delete('/:id', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/announcements/stop/:stopId — get for a stop
router.get('/stop/:stopId', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query(
      'SELECT * FROM announcements WHERE stop_id=$1 LIMIT 1',
      [req.params.stopId]
    );
    res.json(rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
