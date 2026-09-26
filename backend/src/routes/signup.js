
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sendEmail } = require('../services/emailService');
const { adminNotification, clientConfirmation } = require('../templates/signupEmails');

router.post('/request', async (req, res) => {
  const { name, email, phone, company_name, address, city, pincode, gstin, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name आणि email आवश्यक' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email टाका' });
  }

  const client = await pool.connect();
  try {
    const existing = await client.query(
      'SELECT id, status FROM signup_requests WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      const st = existing.rows[0].status;
      if (st === 'pending') return res.status(409).json({ error: 'या email ने आधीच request केली आहे. Admin approval ची वाट पहा.' });
      if (st === 'approved') return res.status(409).json({ error: 'हे account आधीच तयार आहे. Login करा.' });

      await client.query(
        'UPDATE signup_requests SET name=$1, phone=$2, company_name=$3, address=$4, city=$5, pincode=$6, gstin=$7, message=$8, status=$9, updated_at=NOW() WHERE id=$10',
        [name, phone, company_name, address, city, pincode, gstin, message, 'pending', existing.rows[0].id]
      );
      const reqId = existing.rows[0].id;

      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: 'New Signup Request (retry) - ' + (company_name || name),
          html: adminNotification({ id: reqId, name, email, phone, company_name, city, gstin, message }).html,
        });
      } catch (mailErr) { console.error('Admin email failed:', mailErr.message); }

      return res.json({ success: true, message: 'Request पुन्हा submit झाला.', request_id: reqId });
    }

    const result = await client.query(
      'INSERT INTO signup_requests (name, email, phone, company_name, address, city, pincode, gstin, message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, name, email, phone, company_name, city, gstin, message',
      [name, email, phone, company_name, address, city, pincode, gstin, message]
    );
    const reqData = result.rows[0];

    const emails = [];
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'New Signup Request - ' + (company_name || name),
        html: adminNotification(reqData).html,
      });
      emails.push('admin');
    } catch (e) { console.error('Admin email:', e.message); }

    try {
      await sendEmail({
        to: email,
        subject: 'Signup request मिळाला - GM Bus Service',
        html: clientConfirmation(reqData).html,
      });
      emails.push('client');
    } catch (e) { console.error('Client email:', e.message); }

    res.json({
      success: true,
      message: 'Signup request यशस्वी! Admin approval ची वाट पहा.',
      request_id: reqData.id,
      emails_sent: emails,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/status/:email', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, status, admin_notes, created_at, reviewed_at FROM signup_requests WHERE LOWER(email) = LOWER($1)',
      [req.params.email]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Request मिळाला नाही' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
