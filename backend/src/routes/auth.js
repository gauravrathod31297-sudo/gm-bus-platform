const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', authController.clientLogin);

// POST /api/auth/change-password
router.post('/change-password', authenticate, authController.changePassword);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
