const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

// List all stops (or by route)
router.get('/', async (req, res) => {
  try {
    const { route_id } = req.query;
    let q = 'SELECT * FROM stops';
    const params = [];
    if (route_id) { q += ' WHERE route_id=$1'; params.push(route_id); }
    q += ' ORDER BY stop_order ASC';
    const { rows } = await req.tenantDb.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single stop
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM stops WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete stop
router.delete('/:id', async (req, res) => {
  try {
    await req.tenantDb.query('DELETE FROM stops WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
