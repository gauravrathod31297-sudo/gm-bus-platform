const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const masterDb = require('../config/database');
const { execSync } = require('child_process');

const JWT_SECRET = process.env.JWT_SECRET || 'gm-bus-secret-key-change-me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmbus.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

// Admin auth middleware
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Not admin' });
    req.admin = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ⭐ Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (email !== ADMIN_EMAIL) return res.status(401).json({ error: 'Invalid credentials' });
    // Simple check (change in production to use hashed)
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, admin: { email, name: 'Super Admin' } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.use(adminAuth);

// ⭐ List all clients
router.get('/clients', async (req, res) => {
  try {
    const { rows } = await masterDb.query(
      `SELECT id, company_name, email, phone, db_name, preferred_language,
              is_active, created_at
       FROM clients ORDER BY id DESC`
    );
    // Get counts per client
    const clients = await Promise.all(rows.map(async c => {
      try {
        const client = new Client({ connectionString: process.env.MASTER_DB_URL });
        await client.connect();
        // Connect to tenant DB
        const tenantUrl = (process.env.MASTER_DB_URL || '').replace(/\/[^/]+$/, `/${c.db_name}`);
        const tClient = new Client({ connectionString: tenantUrl });
        await tClient.connect();
        const busRes = await tClient.query('SELECT COUNT(*) FROM buses').catch(() => ({ rows: [{ count: 0 }] }));
        const routeRes = await tClient.query('SELECT COUNT(*) FROM routes').catch(() => ({ rows: [{ count: 0 }] }));
        const stopRes = await tClient.query('SELECT COUNT(*) FROM stops').catch(() => ({ rows: [{ count: 0 }] }));
        await tClient.end();
        await client.end();
        return { ...c, buses: parseInt(busRes.rows[0].count), routes: parseInt(routeRes.rows[0].count), stops: parseInt(stopRes.rows[0].count) };
      } catch { return { ...c, buses: 0, routes: 0, stops: 0 }; }
    }));
    res.json(clients);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ⭐ Add new client + auto-create tenant DB
router.post('/clients', async (req, res) => {
  const { company_name, email, phone, password, preferred_language } = req.body;
  if (!company_name || !email || !password) {
    return res.status(400).json({ error: 'company_name, email, password required' });
  }
  const lang = ['en', 'mr', 'gu', 'hi'].includes(preferred_language) ? preferred_language : 'en';
  const timestamp = Date.now();
  const dbName = `client_${timestamp}`;

  try {
    // 1. Insert into master clients
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await masterDb.query(
      `INSERT INTO clients (company_name, email, phone, password, db_name, preferred_language, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id, company_name, email, db_name, preferred_language`,
      [company_name, email, phone || null, hashed, dbName, lang]
    );
    const client = rows[0];

    // 2. Create tenant DB and tables
    const masterUrl = process.env.MASTER_DB_URL || '';
    const baseMatch = masterUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!baseMatch) throw new Error('Cannot parse DB URL');
    const [, user, pwd, host, port] = baseMatch;

    const sql = `
      CREATE DATABASE ${dbName};
    `;
    execSync(`PGPASSWORD="${pwd}" psql -U ${user} -h ${host} -p ${port} -c "CREATE DATABASE ${dbName};"`, { stdio: 'ignore' });

    // Connect to new DB and create tables
    const tenantUrl = `postgres://${user}:${pwd}@${host}:${port}/${dbName}`;
    const tClient = new Client({ connectionString: tenantUrl });
    await tClient.connect();
    await tClient.query(`
      CREATE TABLE IF NOT EXISTS buses (
        id SERIAL PRIMARY KEY,
        bus_number VARCHAR(50) NOT NULL,
        driver_name VARCHAR(100),
        driver_phone VARCHAR(20),
        route_id INTEGER,
        capacity INTEGER DEFAULT 40,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        route_name VARCHAR(200) NOT NULL,
        start_point VARCHAR(200),
        end_point VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS stops (
        id SERIAL PRIMARY KEY,
        route_id INTEGER,
        stop_name VARCHAR(200) NOT NULL,
        stop_name_mr VARCHAR(200),
        stop_name_gu VARCHAR(200),
        stop_name_hi VARCHAR(200),
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        stop_order INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS live_locations (
        id SERIAL PRIMARY KEY,
        bus_id INTEGER,
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        speed DECIMAL(6,2) DEFAULT 0,
        heading DECIMAL(6,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        voice_mode VARCHAR(20) DEFAULT 'auto',
        voice_languages VARCHAR(50) DEFAULT 'gu,hi,en',
        announcement_timer INTEGER DEFAULT 15,
        voice_speed DECIMAL(3,2) DEFAULT 1.0
      );
      INSERT INTO settings (voice_mode, voice_languages, announcement_timer) VALUES ('auto', 'gu,hi,en', 15) ON CONFLICT DO NOTHING;
    `);
    await tClient.end();

    res.json({ success: true, client });
  } catch (err) {
    // Rollback: delete client if DB failed
    try { await masterDb.query('DELETE FROM clients WHERE email=$1', [email]); } catch {}
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Update client language
router.put('/clients/:id/language', async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'mr', 'gu', 'hi'].includes(language)) return res.status(400).json({ error: 'Invalid language' });
    await masterDb.query('UPDATE clients SET preferred_language=$1 WHERE id=$2', [language, req.params.id]);
    res.json({ success: true, language });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ⭐ Toggle active
router.put('/clients/:id/toggle', async (req, res) => {
  try {
    const { rows } = await masterDb.query(
      'UPDATE clients SET is_active = NOT is_active WHERE id=$1 RETURNING is_active',
      [req.params.id]
    );
    res.json({ success: true, is_active: rows[0].is_active });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ⭐ Delete client + drop DB
router.delete('/clients/:id', async (req, res) => {
  try {
    const { rows } = await masterDb.query('SELECT db_name FROM clients WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    const dbName = rows[0].db_name;
    await masterDb.query('DELETE FROM clients WHERE id=$1', [req.params.id]);
    // Drop DB
    const masterUrl = process.env.MASTER_DB_URL || '';
    const m = masterUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (m) {
      const [, user, pwd, host, port] = m;
      try {
        execSync(`PGPASSWORD="${pwd}" psql -U ${user} -h ${host} -p ${port} -c "DROP DATABASE IF EXISTS ${dbName};"`, { stdio: 'ignore' });
      } catch (e) { console.error('Drop DB failed:', e.message); }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ⭐ Stats for admin dashboard
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await masterDb.query('SELECT COUNT(*) FROM clients');
    const activeRes = await masterDb.query('SELECT COUNT(*) FROM clients WHERE is_active=true');
    res.json({
      total_clients: parseInt(rows[0].count),
      active_clients: parseInt(activeRes.rows[0].count),
      total_buses: 0,
      total_routes: 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
