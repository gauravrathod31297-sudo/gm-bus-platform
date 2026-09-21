const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', adminController.login);

// सर्व admin routes protected आहेत
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', adminController.stats);

// GET /api/admin/clients
router.get('/clients', adminController.listClients);

// GET /api/admin/clients/:id
router.get('/clients/:id', adminController.getClient);

// PUT /api/admin/clients/:id/settings
router.put('/clients/:id/settings', adminController.updateClientSettings);

// GET /api/admin/requests
router.get('/requests', adminController.listRequests);

// POST /api/admin/requests/:requestId/approve
router.post('/requests/:requestId/approve', adminController.approveRequest);

// POST /api/admin/requests/:requestId/reject
router.post('/requests/:requestId/reject', adminController.rejectRequest);

module.exports = router;
