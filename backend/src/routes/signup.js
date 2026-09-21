const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');

// POST /api/signup
router.post('/', signupController.signup);

// GET /api/signup/status/:email
router.get('/status/:email', signupController.checkStatus);

module.exports = router;
