const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const masterDb = require('../config/database');

router.post('/login', authController.clientLogin);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

// ⭐ NEW: Client can change own UI language
router.put('/language', authenticate, async (req, res) => {
  try {
    const { language } = req.body;
    const allowed = ['en', 'mr', 'gu', 'hi'];
    if (!allowed.includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }
    const clientId = req.user.client_id;
    await masterDb.query('UPDATE clients SET preferred_language=$1 WHERE id=$2', [language, clientId]);
    res.json({ success: true, language });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
