const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const masterDb = require('../config/database');
const { sendOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'gm-bus-secret-key-change-me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmbus.com';
const OTP_EXPIRY_MIN = 5;
const MAX_ATTEMPTS = 5;

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

// Look up user type from email
async function findUser(email) {
  // ADMIN FIRST — admin_users table + ADMIN_EMAIL env fallback
  let adminRow = null;
  try {
    const { rows: aRows } = await masterDb.query(
      'SELECT * FROM admin_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    adminRow = aRows[0] || null;
  } catch (e) { /* admin_users table optional */ }
  if (adminRow || email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return {
      type: 'admin',
      email: adminRow?.email || email,
      name: adminRow?.name || adminRow?.full_name || 'Super Admin',
      company: 'GM Media',
      password_hash: adminRow?.password_hash || null,
    };
  }

  // CLIENT — fallback
  const { rows: cRows } = await masterDb.query(
    'SELECT id, company_name, email, phone, preferred_language, is_active, password_hash FROM clients WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );
  if (cRows[0]) {
    if (!cRows[0].is_active) throw new Error('Account disabled. Contact support.');
    return {
      type: 'client',
      id: cRows[0].id,
      email: cRows[0].email,
      name: cRows[0].company_name,
      company: cRows[0].company_name,
      phone: cRows[0].phone,
      preferred_language: cRows[0].preferred_language,
      password_hash: cRows[0].password_hash,
    };
  }
  return null;
}

// POST /api/auth-otp/send
router.post('/send', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password required (min 4 chars)' });
    }

    const user = await findUser(email);
    if (!user) {
      return res.status(404).json({ error: 'User does not exist' });
    }

    if (user.password_hash) {
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Throttle: max N OTP in last 10 minutes (env-tunable, default 10)
    const OTP_MAX_PER_10MIN = parseInt(process.env.OTP_MAX_PER_10MIN || '10', 10);
    const recent = await masterDb.query(
      `SELECT COUNT(*) FROM otp_tokens WHERE email=$1 AND created_at > NOW() - INTERVAL '10 minutes'`,
      [email]
    );
    if (parseInt(recent.rows[0].count) >= OTP_MAX_PER_10MIN) {
      return res.status(429).json({ error: `Too many requests. Try again in 10 minutes.` });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    await masterDb.query(
      `INSERT INTO otp_tokens (email, otp, purpose, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, otp, 'login', expiresAt, req.ip || null, (req.headers['user-agent'] || '').slice(0, 200)]
    );

    await sendOtpEmail(email, otp, 'login');

    console.log(`🔐 OTP sent to ${email} (${user.type})`);
    res.json({
      success: true,
      message: 'OTP sent to your email',
      email,
      expiresIn: OTP_EXPIRY_MIN * 60,
      user_type: user.type,
    });
  } catch (err) {
    console.error('OTP send error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

// POST /api/auth-otp/verify
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email + OTP required' });
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'Invalid OTP format' });

    const { rows } = await masterDb.query(
      `SELECT id, otp, expires_at, used, attempts FROM otp_tokens
       WHERE email=$1 AND purpose='login' AND used=false
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!rows[0]) return res.status(400).json({ error: 'No active OTP. Request a new one.' });
    const record = rows[0];

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await masterDb.query('UPDATE otp_tokens SET used=true WHERE id=$1', [record.id]);
      return res.status(429).json({ error: 'Too many wrong attempts. Request a new OTP.' });
    }

    if (record.otp !== otp) {
      await masterDb.query('UPDATE otp_tokens SET attempts=attempts+1 WHERE id=$1', [record.id]);
      return res.status(400).json({ error: 'Invalid OTP', attempts_left: MAX_ATTEMPTS - record.attempts - 1 });
    }

    // Mark used
    await masterDb.query('UPDATE otp_tokens SET used=true WHERE id=$1', [record.id]);

    // Build user + token
    const user = await findUser(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const payload = user.type === 'admin'
      ? { role: 'admin', email, name: 'Super Admin' }
      : { role: 'client', client_id: user.id, email, name: user.name, company: user.company };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Update last_login for client
    if (user.type === 'client') {
      await masterDb.query('UPDATE clients SET last_login=NOW() WHERE id=$1', [user.id]).catch(() => {});
    }

    console.log(`✅ OTP verified for ${email} (${user.type})`);
    res.json({
      success: true,
      token,
      user: {
        type: user.type,
        email: user.email,
        name: user.name,
        company: user.company,
        phone: user.phone,
        preferred_language: user.preferred_language,
        client_id: user.id,
      },
    });
  } catch (err) {
    console.error('OTP verify error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to verify OTP' });
  }
});

// POST /api/auth-otp/resend — same as send but allows quicker
router.post('/resend', async (req, res) => {
  req.url = '/send';
  router.handle(req, res, () => {});
});

module.exports = router;
