const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const masterDb = require('../config/database');
const { sendOtpEmail, sendTempPasswordEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'gm-bus-secret-key-change-me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmbus.com';
const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MIN = 5;
const TEMP_PW_EXPIRY_HOURS = 24;

function generateOtp() { return String(crypto.randomInt(100000, 999999)); }

function generateTempPassword() {
  // 10-char password: 4 letters + 4 digits + 2 symbols
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '@#$';
  let pw = '';
  for (let i = 0; i < 4; i++) pw += letters[crypto.randomInt(letters.length)];
  for (let i = 0; i < 4; i++) pw += digits[crypto.randomInt(digits.length)];
  for (let i = 0; i < 2; i++) pw += symbols[crypto.randomInt(symbols.length)];
  return pw;
}

async function findUser(email) {
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    const { rows } = await masterDb.query('SELECT * FROM admin_users WHERE LOWER(email)=LOWER($1) LIMIT 1', [email]);
    if (rows[0]) return { type: 'admin', id: rows[0].id, email: rows[0].email, name: rows[0].name };
    return { type: 'admin', id: null, email, name: 'Super Admin' };
  }
  const { rows } = await masterDb.query(
    'SELECT id, company_name, email, is_active FROM clients WHERE LOWER(email)=LOWER($1) LIMIT 1',
    [email]
  );
  if (rows[0]) {
    if (!rows[0].is_active) throw new Error('Account disabled. Contact support.');
    return { type: 'client', id: rows[0].id, email: rows[0].email, name: rows[0].company_name };
  }
  return null;
}

// POST /api/password-reset/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    const user = await findUser(email);
    if (!user) return res.status(404).json({ error: 'Email not registered' });

    // Throttle
    const recent = await masterDb.query(
      `SELECT COUNT(*) FROM otp_tokens WHERE email=$1 AND purpose='reset' AND created_at > NOW() - INTERVAL '10 minutes'`,
      [email]
    );
    if (parseInt(recent.rows[0].count) >= 3) {
      return res.status(429).json({ error: 'Too many requests. Try again in 10 minutes.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    await masterDb.query(
      `INSERT INTO otp_tokens (email, otp, purpose, expires_at, ip, user_agent)
       VALUES ($1, $2, 'reset', $3, $4, $5)`,
      [email, otp, expiresAt, req.ip || null, (req.headers['user-agent'] || '').slice(0, 200)]
    );

    await sendOtpEmail(email, otp, 'reset');
    console.log(`🔑 Reset OTP sent to ${email}`);

    res.json({ success: true, message: 'Reset OTP sent to your email', email, expiresIn: OTP_EXPIRY_MIN * 60 });
  } catch (err) {
    console.error('Reset OTP error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/password-reset/verify
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp || !/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'Email + 6-digit OTP required' });

    const { rows } = await masterDb.query(
      `SELECT id, otp, expires_at, attempts FROM otp_tokens
       WHERE email=$1 AND purpose='reset' AND used=false
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!rows[0]) return res.status(400).json({ error: 'No active reset request' });
    const record = rows[0];

    if (new Date(record.expires_at) < new Date()) return res.status(400).json({ error: 'OTP expired' });
    if (record.attempts >= MAX_ATTEMPTS) {
      await masterDb.query('UPDATE otp_tokens SET used=true WHERE id=$1', [record.id]);
      return res.status(429).json({ error: 'Too many attempts' });
    }
    if (record.otp !== otp) {
      await masterDb.query('UPDATE otp_tokens SET attempts=attempts+1 WHERE id=$1', [record.id]);
      return res.status(400).json({ error: 'Invalid OTP', attempts_left: MAX_ATTEMPTS - record.attempts - 1 });
    }

    // Mark OTP used
    await masterDb.query('UPDATE otp_tokens SET used=true WHERE id=$1', [record.id]);

    // Generate temp password
    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const expiry = new Date(Date.now() + TEMP_PW_EXPIRY_HOURS * 60 * 60 * 1000);

    const user = await findUser(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.type === 'admin') {
      await masterDb.query(
        `INSERT INTO admin_users (email, password, name, must_change_password, temp_password_expires_at, updated_at)
         VALUES ($1, $2, $3, true, $4, NOW())
         ON CONFLICT (email) DO UPDATE SET
           password=$2, must_change_password=true, temp_password_expires_at=$4, updated_at=NOW()`,
        [email, hashed, user.name, expiry]
      );
    } else {
      await masterDb.query(
        `UPDATE clients SET password=$1, must_change_password=true, temp_password_expires_at=$2, failed_login_attempts=0, locked_until=NULL WHERE id=$3`,
        [hashed, expiry, user.id]
      );
    }

    await sendTempPasswordEmail(email, tempPassword);
    console.log(`🔐 Temp password generated for ${email}`);

    res.json({
      success: true,
      message: 'Temporary password sent to your email',
      temp_password: tempPassword, // also shown on screen for convenience
      expires_in_hours: TEMP_PW_EXPIRY_HOURS,
      user_type: user.type,
    });
  } catch (err) {
    console.error('Reset verify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/password-reset/login-temp — login with temp password
router.post('/login-temp', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email + password required' });

    const user = await findUser(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    let dbPassword, mustChange, tempExpiry, isActive = true;

    if (user.type === 'admin') {
      const { rows } = await masterDb.query('SELECT password, must_change_password, temp_password_expires_at FROM admin_users WHERE LOWER(email)=LOWER($1)', [email]);
      if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
      dbPassword = rows[0].password; mustChange = rows[0].must_change_password; tempExpiry = rows[0].temp_password_expires_at;
    } else {
      const { rows } = await masterDb.query('SELECT password, must_change_password, temp_password_expires_at FROM clients WHERE id=$1', [user.id]);
      if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
      dbPassword = rows[0].password; mustChange = rows[0].must_change_password; tempExpiry = rows[0].temp_password_expires_at;
    }

    const ok = await bcrypt.compare(password, dbPassword).catch(() => false);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (mustChange && tempExpiry && new Date(tempExpiry) < new Date()) {
      return res.status(401).json({ error: 'Temporary password expired. Request a new one.' });
    }

    const payload = user.type === 'admin'
      ? { role: 'admin', email, name: user.name, must_change_password: !!mustChange }
      : { role: 'client', client_id: user.id, email, name: user.name, must_change_password: !!mustChange };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    if (user.type === 'client') {
      await masterDb.query('UPDATE clients SET last_login=NOW() WHERE id=$1', [user.id]).catch(() => {});
    } else {
      await masterDb.query('UPDATE admin_users SET last_login=NOW() WHERE id=$1', [user.id]).catch(() => {});
    }

    res.json({
      success: true, token,
      must_change_password: !!mustChange,
      user: { type: user.type, email, name: user.name, client_id: user.id },
    });
  } catch (err) {
    console.error('Temp login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/password-reset/change — user changes own password
router.post('/change', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) return res.status(400).json({ error: 'All fields required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be 8+ characters' });
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password needs uppercase + number' });
    }

    const user = await findUser(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashed = await bcrypt.hash(newPassword, 10);

    if (user.type === 'admin') {
      const { rows } = await masterDb.query('SELECT password FROM admin_users WHERE LOWER(email)=LOWER($1)', [email]);
      if (!rows[0]) return res.status(404).json({ error: 'Admin not found' });
      const ok = await bcrypt.compare(oldPassword, rows[0].password).catch(() => false);
      if (!ok) return res.status(401).json({ error: 'Current password wrong' });

      await masterDb.query(
        `UPDATE admin_users SET password=$1, must_change_password=false, temp_password_expires_at=NULL, updated_at=NOW() WHERE LOWER(email)=LOWER($2)`,
        [hashed, email]
      );
    } else {
      const { rows } = await masterDb.query('SELECT password FROM clients WHERE id=$1', [user.id]);
      const ok = await bcrypt.compare(oldPassword, rows[0].password).catch(() => false);
      if (!ok) return res.status(401).json({ error: 'Current password wrong' });

      await masterDb.query(
        `UPDATE clients SET password=$1, must_change_password=false, temp_password_expires_at=NULL WHERE id=$2`,
        [hashed, user.id]
      );
    }

    console.log(`✅ Password changed for ${email}`);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change pw error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
