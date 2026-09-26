
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');
const { clientApproval, clientRejection } = require('../templates/signupEmails');

const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ─── Signup Requests ───
router.get('/signup-requests', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const r = await pool.query('SELECT * FROM signup_requests WHERE status = $1 ORDER BY created_at DESC', [status]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/signup-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const sr = await pool.query('SELECT * FROM signup_requests WHERE id=$1', [id]);
    if (sr.rows.length === 0) return res.status(404).json({ error: 'Request नाही' });
    const rq = sr.rows[0];
    if (rq.status === 'approved') return res.status(400).json({ error: 'आधीच approved' });

    const tempPassword = 'GM' + crypto.randomBytes(4).toString('hex').toUpperCase() + 'X';
    const hash = await bcrypt.hash(tempPassword, 10);
    const tenantDb = 'client_' + Date.now() + '_' + Math.floor(Math.random()*10000);

    // STEP 1: Tenant DB आधी तयार करा (transaction बाहेर)
    try {
      await pool.query('CREATE DATABASE "' + tenantDb + '"');
      console.log('Tenant DB created: ' + tenantDb);
    } catch (dbErr) {
      console.warn('Tenant DB fail (continuing): ' + dbErr.message);
    }

    // STEP 2: Client insert + signup update — transaction मध्ये
    const client = await pool.connect();
    let newClient;
    try {
      await client.query('BEGIN');
      const clientIns = await client.query(
        "INSERT INTO clients (company_name, owner_name, email, phone, address, city, pincode, gstin, password_hash, is_active, tenant_db_name, approved_at, license_type, license_expires_at, plan, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,NOW(),$11, NOW() + INTERVAL '30 days', 'basic', 'approved') RETURNING id, company_name, owner_name, email",
        [rq.company_name, rq.owner_name || rq.name || '', rq.email, rq.phone, rq.address, rq.city, rq.pincode, rq.gstin, hash, tenantDb, 'basic']
      );
      newClient = clientIns.rows[0];
      await client.query('UPDATE signup_requests SET status=$1, reviewed_at=NOW(), updated_at=NOW() WHERE id=$2', ['approved', id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // STEP 3: Welcome email (fail झाला तरी चालेल)
    try {
      await sendEmail({
        to: newClient.email,
        subject: 'तुमचं account तयार आहे - GM Bus Service',
        html: clientApproval(newClient, tempPassword).html,
      });
    } catch (e) { console.error('Welcome email fail:', e.message); }

    res.json({ success: true, client: newClient, temp_password: tempPassword, tenant_db: tenantDb });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/signup-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const r = await pool.query(
      'UPDATE signup_requests SET status=$1, admin_notes=$2, reviewed_at=NOW(), updated_at=NOW() WHERE id=$3 RETURNING *',
      ['rejected', reason || null, id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Request नाही' });

    try {
      await sendEmail({
        to: r.rows[0].email,
        subject: 'Signup request update - GM Bus Service',
        html: clientRejection(r.rows[0], reason).html,
      });
    } catch (e) { console.error('Reject email fail:', e.message); }

    res.json({ success: true, request: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Clients ───
router.get('/clients', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, owner_name, email, phone, company_name, city, is_active, license_type, license_expires_at, max_buses, max_drivers, max_users, tenant_db_name, created_at, approved_at FROM clients ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/clients/:id/reset-password', async (req, res) => {
  try {
    const tempPass = 'GM' + crypto.randomBytes(4).toString('hex').toUpperCase() + 'X';
    const hash = await bcrypt.hash(tempPass, 10);
    await pool.query('UPDATE clients SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.params.id]);

    const c = await pool.query('SELECT owner_name AS name, email FROM clients WHERE id=$1', [req.params.id]);
    if (c.rows[0]) {
      try {
        await sendEmail({
          to: c.rows[0].email,
          subject: 'Password reset - GM Bus Service',
          html: '<p>नमस्कार ' + c.rows[0].name + ',</p><p>नवीन temporary password: <code>' + tempPass + '</code></p>',
        });
      } catch (e) { console.error('Reset email fail:', e.message); }
    }
    res.json({ success: true, temp_password: tempPass });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const b = req.body;
    const r = await pool.query(
      'UPDATE clients SET owner_name=COALESCE($1,owner_name), phone=COALESCE($2,phone), company_name=COALESCE($3,company_name), city=COALESCE($4,city), is_active=COALESCE($5,is_active), license_type=COALESCE($6,license_type), license_expires_at=COALESCE($7,license_expires_at), max_buses=COALESCE($8,max_buses), max_drivers=COALESCE($9,max_drivers), max_users=COALESCE($10,max_users), updated_at=NOW() WHERE id=$11 RETURNING id, owner_name, email, license_type, is_active',
      [b.name, b.phone, b.company_name, b.city, b.is_active, b.license_type, b.license_expires_at, b.max_buses, b.max_drivers, b.max_users, req.params.id]
    );
    res.json({ success: true, client: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/clients/:id', async (req, res) => {
  try {
    await pool.query('UPDATE clients SET is_active=false, updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SMTP ───
router.get('/clients/:id/smtp', async (req, res) => {
  try {
    const r = await pool.query('SELECT smtp_host, smtp_port, smtp_user, smtp_from_email, smtp_from_name, smtp_secure FROM clients WHERE id=$1', [req.params.id]);
    res.json(r.rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/clients/:id/smtp', async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      'UPDATE clients SET smtp_host=$1, smtp_port=$2, smtp_user=$3, smtp_pass=COALESCE($4, smtp_pass), smtp_from_email=$5, smtp_from_name=$6, smtp_secure=$7, updated_at=NOW() WHERE id=$8',
      [b.smtp_host, b.smtp_port, b.smtp_user, b.smtp_pass || null, b.smtp_from_email, b.smtp_from_name, b.smtp_secure || false, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/clients/:id/smtp/test', async (req, res) => {
  try {
    const { to } = req.body;
    const r = await pool.query('SELECT * FROM clients WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Client नाही' });
    const c = r.rows[0];
    await sendEmail({
      to: to || c.email,
      subject: 'SMTP Test - GM Bus Service',
      html: '<p>Test email यशस्वी!</p>',
      cfg: { host: c.smtp_host, port: c.smtp_port, user: c.smtp_user, pass: c.smtp_pass, secure: c.smtp_secure, from_email: c.smtp_from_email, from_name: c.smtp_from_name },
    });
    res.json({ success: true, message: 'Test email पाठवला!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─── Dashboard stats ───
router.get('/stats', async (req, res) => {
  try {
    const [total, active, pending, new30] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n FROM clients'),
      pool.query("SELECT COUNT(*)::int AS n FROM clients WHERE is_active=true AND status='approved'"),
      pool.query("SELECT COUNT(*)::int AS n FROM signup_requests WHERE status='pending'"),
      pool.query("SELECT COUNT(*)::int AS n FROM clients WHERE created_at > NOW() - INTERVAL '30 days'"),
    ]);
    const signups = await pool.query(
      "SELECT to_char(DATE_TRUNC('week', created_at), 'Mon DD') AS label, COUNT(*)::int AS n FROM clients WHERE created_at > NOW() - INTERVAL '12 weeks' GROUP BY DATE_TRUNC('week', created_at) ORDER BY DATE_TRUNC('week', created_at)"
    );
    const recent = await pool.query(
      "SELECT id, company_name, owner_name, email, city, is_active, license_type, created_at FROM clients ORDER BY created_at DESC LIMIT 8"
    );
    const lic = await pool.query(
      "SELECT COALESCE(license_type,'basic') AS license_type, COUNT(*)::int AS n FROM clients GROUP BY license_type"
    );
    res.json({
      totals: {
        clients: total.rows[0].n,
        active: active.rows[0].n,
        pending: pending.rows[0].n,
        newLast30: new30.rows[0].n,
      },
      signupsOverTime: signups.rows,
      recentClients: recent.rows,
      licenseBreakdown: lic.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/activity', async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT 'client_signup' AS type, id, company_name AS title, email AS subtitle, created_at FROM clients ORDER BY created_at DESC LIMIT 20"
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// ─── Deployment: per-client Buses (uses tenant DB) ───
const { getTenantDb } = require('../config/tenantDb');
const crypto2 = require('crypto');

async function tenantForClient(clientId) {
  const r = await pool.query('SELECT db_name, status FROM clients WHERE id=$1', [clientId]);
  if (!r.rows[0]) throw new Error('Client नाही');
  const dbName = r.rows[0].db_name;
  if (!dbName || dbName === 'null') throw new Error('या client चा tenant DB तयार नाही (pending)');
  try {
    return await getTenantDb(dbName);
  } catch (e) {
    const { clearTenantCache } = require('../config/tenantDb');
    try { clearTenantCache(dbName); } catch {}
    throw new Error('Tenant DB "' + dbName + '" सापडला नाही — admin ला विचारा');
  }
}

function pairingToken(busNumber) {
  const secret = process.env.JWT_SECRET || 'gm-dev-secret';
  return crypto2.createHmac('sha256', secret)
    .update(String(busNumber))
    .digest('hex').slice(0, 10).toUpperCase();
}

// List buses
router.get('/clients/:id/buses', async (req, res) => {
  try {
    const db = await tenantForClient(req.params.id);
    const { rows } = await db.query('SELECT * FROM buses ORDER BY id DESC');
    res.json(rows.map(b => ({ ...b, pairing_token: pairingToken(b.bus_number) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create bus
router.post('/clients/:id/buses', async (req, res) => {
  try {
    const db = await tenantForClient(req.params.id);
    const { bus_number, driver_name, driver_phone, route_id, capacity } = req.body;
    if (!bus_number) return res.status(400).json({ error: 'bus_number required' });
    const { rows } = await db.query(
      'INSERT INTO buses (bus_number, driver_name, driver_phone, route_id, capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [bus_number, driver_name || null, driver_phone || null, route_id || null, capacity || 40]
    );
    res.json({ ...rows[0], pairing_token: pairingToken(rows[0].bus_number) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete bus
router.delete('/clients/:id/buses/:busId', async (req, res) => {
  try {
    const db = await tenantForClient(req.params.id);
    await db.query('DELETE FROM buses WHERE id=$1', [req.params.busId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Admin Users CRUD ───
const bcrypt3 = require('bcryptjs');
const crypto3 = require('crypto');

router.get('/users', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, username, name, email, role, last_login, updated_at FROM admin_users ORDER BY id ASC'
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const exists = await pool.query('SELECT id FROM admin_users WHERE LOWER(email)=LOWER($1)', [email]);
    if (exists.rows.length) return res.status(400).json({ error: 'Email already exists' });
    const temp = 'GM' + crypto3.randomBytes(4).toString('hex').toUpperCase() + 'X';
    const hash = await bcrypt3.hash(temp, 10);
    const r = await pool.query(
      'INSERT INTO admin_users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hash, 'admin']
    );
    res.json({ ...r.rows[0], temp_password: temp });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const r = await pool.query(
      'UPDATE admin_users SET name=$1, email=$2, updated_at=now() WHERE id=$3 RETURNING id, name, email, role',
      [name, email, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Admin not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM admin_users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Admin Profile (self) ───
router.get('/me', async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(400).json({ error: 'No email in token' });
    const r = await pool.query(
      'SELECT id, name, email, role, last_login FROM admin_users WHERE LOWER(email)=LOWER($1)',
      [email]
    );
    res.json(r.rows[0] || { name: 'Super Admin', email, role: 'superadmin' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/me', async (req, res) => {
  try {
    const email = req.user?.email;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    await pool.query(
      'UPDATE admin_users SET name=$1, updated_at=now() WHERE LOWER(email)=LOWER($2)',
      [name, email]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/me/password', async (req, res) => {
  try {
    const email = req.user?.email;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Password 6+ chars' });
    const r = await pool.query('SELECT password_hash FROM admin_users WHERE LOWER(email)=LOWER($1)', [email]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Admin not found' });
    const bcrypt4 = require('bcryptjs');
    const ok = await bcrypt4.compare(current_password, r.rows[0].password_hash || '');
    if (!ok) return res.status(400).json({ error: 'Current password चुकीचा' });
    const hash = await bcrypt4.hash(new_password, 10);
    await pool.query('UPDATE admin_users SET password_hash=$1, updated_at=now() WHERE LOWER(email)=LOWER($2)', [hash, email]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Platform Settings (stored in a settings table) ───
router.get('/settings', async (req, res) => {
  try {
    const r = await pool.query("SELECT key, value FROM platform_settings");
    const out = {};
    r.rows.forEach(row => { out[row.key] = row.value });
    res.json(out);
  } catch (e) {
    // table might not exist
    res.json({});
  }
});

router.put('/settings', async (req, res) => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT now()
    )`);
    const entries = Object.entries(req.body || {});
    for (const [k, v] of entries) {
      await pool.query(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [k, String(v)]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
