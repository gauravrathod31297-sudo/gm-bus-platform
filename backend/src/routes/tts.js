const express = require('express');
const router = express.Router();
const { generateTTS } = require('../services/ttsService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/generate', async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'text required' });
    }
    if (!['mr', 'gu', 'hi', 'en'].includes(lang)) {
      return res.status(400).json({ error: 'lang must be mr, gu, hi, or en' });
    }
    const result = await generateTTS(text, lang);
    res.json({ success: true, ...result, text, lang });
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Public: list generated audio files
router.get('/list', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '../../public/audio');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'));
    res.json({ count: files.length, files });
  } catch (err) { res.json({ count: 0, files: [] }); }
});

module.exports = router;
