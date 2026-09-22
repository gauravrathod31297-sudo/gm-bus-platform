const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/login', adminController.login);
router.use(authenticate, requireAdmin);

router.get('/stats', adminController.stats);
router.get('/clients', adminController.listClients);
router.get('/clients/:id', adminController.getClient);
router.put('/clients/:id/settings', adminController.updateClientSettings);
router.put('/clients/:id/language', adminController.updateClientLanguage);
router.get('/requests', adminController.listRequests);
router.post('/requests/:requestId/approve', adminController.approveRequest);
router.post('/requests/:requestId/reject', adminController.rejectRequest);

module.exports = router;
