const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

const ROLES = {
  owner:    { name: 'Owner',    level: 100, all: true },
  admin:    { name: 'Admin',    level: 80,  all: true },
  manager:  { name: 'Manager',  level: 60,  all: false },
  operator: { name: 'Operator', level: 40,  all: false },
  viewer:   { name: 'Viewer',   level: 20,  all: false },
};

function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const role = req.user.role || 'owner';
      if (ROLES[role]?.all) return next();
      const { rows } = await req.tenantDb.query('SELECT permissions FROM tenant_users WHERE email=$1', [req.user.email]);
      const perms = rows[0]?.permissions || {};
      if (perms[permission] === true) return next();
      res.status(403).json({ error: 'Permission denied', required: permission });
    } catch (err) { res.status(500).json({ error: err.message }); }
  };
}

router.get('/roles', (req, res) => {
  res.json(Object.entries(ROLES).map(([k, v]) => ({ id: k, ...v })));
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT id, name, email, phone, role, permissions, is_active, last_login, created_at FROM tenant_users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requirePermission('users.create'), async (req, res) => {
  try {
    const { name, email, phone, password, role, permissions } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    if (!ROLES[role]) return res.status(400).json({ error: 'Invalid role' });
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await req.tenantDb.query(
      'INSERT INTO tenant_users (name, email, phone, password, role, permissions, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, phone, role, permissions, is_active, created_at',
      [name, email, phone || null, hashed, role, JSON.stringify(permissions || {}), req.user.id || null]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requirePermission('users.edit'), async (req, res) => {
  try {
    const { name, phone, role, permissions, is_active } = req.body;
    const { rows } = await req.tenantDb.query(
      'UPDATE tenant_users SET name=$1, phone=$2, role=$3, permissions=$4, is_active=$5, updated_at=NOW() WHERE id=$6 RETURNING id, name, email, phone, role, permissions, is_active',
      [name, phone || null, role, JSON.stringify(permissions || {}), is_active !== false, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requirePermission('users.delete'), async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query("DELETE FROM tenant_users WHERE id=$1 AND role != 'owner' RETURNING id", [req.params.id]);
    if (!rows[0]) return res.status(400).json({ error: 'Cannot delete owner' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/reset-password', requirePermission('users.edit'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Min 6 chars' });
    const hashed = await bcrypt.hash(password, 10);
    await req.tenantDb.query('UPDATE tenant_users SET password=$1 WHERE id=$2', [hashed, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/audit-log', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
