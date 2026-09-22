const express = require('express');
const router = express.Router();
const { translateStopName } = require('../services/translateService');

// POST /api/translate/stop
// Body: { name: "Shivaji Nagar", sourceLang: "en" }
router.post('/stop', async (req, res) => {
  try {
    const { name, sourceLang } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name required' });
    }

    const result = await translateStopName(name.trim(), sourceLang || 'en');
    res.json({ success: true, original: name, translations: result });
  } catch (err) {
    console.error('Translate API error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// POST /api/translate/batch — multiple names
router.post('/batch', async (req, res) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names)) {
      return res.status(400).json({ error: 'names array required' });
    }

    const results = await Promise.all(
      names.map(async (n) => ({
        original: n,
        translations: await translateStopName(n, 'en'),
      }))
    );

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
