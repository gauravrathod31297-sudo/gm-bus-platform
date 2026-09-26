const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { authenticate } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(authenticate, tenantMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1');
    const s = rows[0];
    if (s && s.password) s.password = '••••••••';
    res.json(s || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    const { host, port, secure, username, password, from_name, from_email } = req.body;
    if (!host || !username || !from_email) return res.status(400).json({ error: 'host, username, from_email required' });
    const existing = await req.tenantDb.query('SELECT id, password FROM smtp_settings LIMIT 1');
    let savedPassword = password;
    if (existing.rows[0] && (!password || password === '••••••••')) savedPassword = existing.rows[0].password;

    if (existing.rows[0]) {
      await req.tenantDb.query(
        'UPDATE smtp_settings SET host=$1, port=$2, secure=$3, username=$4, password=$5, from_name=$6, from_email=$7, updated_at=NOW() WHERE id=$8',
        [host, port || 587, secure || false, username, savedPassword, from_name, from_email, existing.rows[0].id]
      );
    } else {
      await req.tenantDb.query(
        'INSERT INTO smtp_settings (host, port, secure, username, password, from_name, from_email) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [host, port || 587, secure || false, username, savedPassword, from_name, from_email]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/test', async (req, res) => {
  try {
    const { rows } = await req.tenantDb.query('SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1');
    const s = rows[0];
    if (!s) return res.status(400).json({ error: 'SMTP not configured' });
    const transporter = nodemailer.createTransport({ host: s.host, port: s.port, secure: s.secure, auth: { user: s.username, pass: s.password } });
    await transporter.verify();
    await req.tenantDb.query('UPDATE smtp_settings SET is_verified=true, last_test=NOW() WHERE id=$1', [s.id]);
    await transporter.sendMail({
      from: `"${s.from_name || 'Test'}" <${s.from_email}>`,
      to: s.from_email,
      subject: '✅ SMTP Test Successful',
      html: '<h2>Your SMTP is working!</h2><p>Test email from GM Bus Tracking.</p>'
    });
    res.json({ success: true, message: 'Test email sent' });
  } catch (err) { res.status(500).json({ error: 'SMTP test failed: ' + err.message }); }
});

router.post('/test-send', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'to required' });
    const { rows } = await req.tenantDb.query('SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1');
    const s = rows[0];
    if (!s) return res.status(400).json({ error: 'SMTP not configured' });
    const transporter = nodemailer.createTransport({ host: s.host, port: s.port, secure: s.secure, auth: { user: s.username, pass: s.password } });
    await transporter.sendMail({ from: `"${s.from_name || 'GM Bus'}" <${s.from_email}>`, to, subject: 'Test Email', html: '<p>Test from GM Bus Tracking.</p>' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
