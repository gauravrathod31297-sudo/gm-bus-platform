const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

// GET voice settings
router.get('/voice', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM client_settings LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT voice settings
router.put('/voice', async (req, res) => {
  try {
    const {
      voice_mode,           // 'auto' | 'manual'
      voice_languages,      // 'mr,gu,en' (comma separated)
      announcement_timer,   // 15 (seconds before)
      voice_speed,          // 1.0
    } = req.body;

    const exists = await req.tenantDb.query('SELECT id FROM client_settings LIMIT 1');
    
    if (exists.rows[0]) {
      await req.tenantDb.query(
        `UPDATE client_settings SET 
          voice_language = $1,
          announcement_timer = $2,
          updated_at = NOW()
         WHERE id = $3`,
        [voice_languages || 'mr,gu,en', announcement_timer || 15, exists.rows[0].id]
      );
    } else {
      await req.tenantDb.query(
        `INSERT INTO client_settings (voice_language, announcement_timer)
         VALUES ($1, $2)`,
        [voice_languages || 'mr,gu,en', announcement_timer || 15]
      );
    }

    res.json({ success: true, message: 'Voice settings saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
