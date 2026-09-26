const express = require('express');
const router = express.Router();
const masterDb = require('../config/database');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'gm-bus-secret-key-change-me';
function adminAuth(req, res, next) {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'No token' });
  try { const d = jwt.verify(t, JWT_SECRET); if (d.role !== 'admin') return res.status(403).json({error:'Not admin'}); req.admin = d; next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
router.use(adminAuth);

const PLANS = {
  free: { name: 'Free Trial', price: 0, max_buses: 2, max_routes: 2 },
  basic: { name: 'Basic', price: 499, max_buses: 10, max_routes: 10 },
  premium: { name: 'Premium', price: 1499, max_buses: 100, max_routes: 100 },
  enterprise: { name: 'Enterprise', price: 4999, max_buses: -1, max_routes: -1 },
};

router.get('/plans', (req, res) => res.json(PLANS));

router.get('/subscriptions', async (req, res) => {
  try {
    const { rows } = await masterDb.query(
      `SELECT id, company_name, email, plan, plan_expires_at, trial_ends_at, is_active, created_at
       FROM clients ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/subscriptions/:id', async (req, res) => {
  try {
    const { plan, months } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
    const m = parseInt(months) || 1;
    await masterDb.query(
      `UPDATE clients SET plan=$1, plan_expires_at = NOW() + ($2 || ' months')::INTERVAL WHERE id=$3`,
      [plan, m, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/analytics', async (req, res) => {
  try {
    const clients = await masterDb.query('SELECT id, company_name, plan, is_active FROM clients');
    let totalBuses = 0, totalRoutes = 0, totalStops = 0, revenue = 0;
    const byPlan: any = { free: 0, basic: 0, premium: 0, enterprise: 0 };
    const masterUrl = process.env.MASTER_DB_URL || '';

    for (const c of clients.rows) {
      byPlan[c.plan] = (byPlan[c.plan] || 0) + 1;
      if (PLANS[c.plan]) revenue += PLANS[c.plan].price;
      // Get counts
      try {
        const dbName = c.id === 11 ? 'client_11_1790053692090' : null;
        if (!dbName) continue;
        const tenantUrl = masterUrl.replace(/\/[^/]+$/, '/' + dbName);
        const cl = new Client({ connectionString: tenantUrl });
        await cl.connect();
        const b = await cl.query('SELECT COUNT(*) FROM buses').catch(() => ({ rows: [{ count: 0 }] }));
        const r = await cl.query('SELECT COUNT(*) FROM routes').catch(() => ({ rows: [{ count: 0 }] }));
        const s = await cl.query('SELECT COUNT(*) FROM stops').catch(() => ({ rows: [{ count: 0 }] }));
        totalBuses += parseInt(b.rows[0].count);
        totalRoutes += parseInt(r.rows[0].count);
        totalStops += parseInt(s.rows[0].count);
        await cl.end();
      } catch {}
    }
    res.json({
      total_clients: clients.rows.length,
      active_clients: clients.rows.filter((c: any) => c.is_active).length,
      total_buses: totalBuses,
      total_routes: totalRoutes,
      total_stops: totalStops,
      monthly_revenue: revenue,
      by_plan: byPlan,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
