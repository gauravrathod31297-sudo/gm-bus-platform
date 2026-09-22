const masterDb = require('../config/database');
const { sendMail } = require('../config/mailer');

// ===== New client signup =====
exports.signup = async (req, res) => {
  try {
    const {
      company_name,
      owner_name,
      email,
      phone,
      city,
      bus_count,
      message,
    } = req.body;

    if (!company_name || !email || !owner_name) {
      return res.status(400).json({
        error: 'Company name, owner name, and email are required',
      });
    }

    const existing = await masterDb.query(
      'SELECT id FROM signup_requests WHERE email=$1 AND status=$2',
      [email, 'pending']
    );

    if (existing.rows[0]) {
      return res.status(400).json({
        error: 'You already have a pending request. Please wait for approval.',
      });
    }

    const result = await masterDb.query(
      `INSERT INTO signup_requests 
       (company_name, owner_name, email, phone, city, bus_count, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [company_name, owner_name, email, phone, city, bus_count, message]
    );

    // ===== Confirmation email to client (ENGLISH) =====
    await sendMail({
      to: email,
      subject: 'GM Bus Tracking — Request Received',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f9fafb;border-radius:12px;">
          <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #2563eb;">
            <h1 style="color:#2563eb;margin:0;font-size:28px;">🚌 GM Bus Tracking</h1>
          </div>
          <div style="padding:30px 0;">
            <h2 style="color:#111;font-size:22px;">Hello ${owner_name},</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;">
              Thank you for your interest in <b>GM Bus Tracking</b>! We have received your signup request.
            </p>
            <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #2563eb;margin:20px 0;">
              <p style="margin:0;color:#6b7280;font-size:13px;">REQUEST DETAILS</p>
              <p style="margin:10px 0 0;color:#111;"><b>Company:</b> ${company_name}</p>
              <p style="margin:5px 0 0;color:#111;"><b>Email:</b> ${email}</p>
              <p style="margin:5px 0 0;color:#111;"><b>Request ID:</b> #${result.rows[0].id}</p>
            </div>
            <p style="color:#374151;font-size:15px;line-height:1.6;">
              Our team will review your information and <b>approve your account within 24-48 hours</b>.
              Once approved, you will receive your login credentials via email.
            </p>
            <p style="color:#374151;font-size:15px;line-height:1.6;">
              If you have any questions, feel free to reply to this email.
            </p>
          </div>
          <div style="padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              Best regards,<br/>
              <b style="color:#2563eb;">GM Bus Tracking Team</b><br/>
              bustracker.gauravmedia.in
            </p>
          </div>
        </div>
      `,
    });

    // ===== Notification email to admin (ENGLISH) =====
    await sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Client Signup — ${company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f9fafb;border-radius:12px;">
          <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #dc2626;">
            <h1 style="color:#dc2626;margin:0;font-size:26px;">🔔 New Client Interested!</h1>
          </div>
          <div style="padding:30px 0;">
            <p style="color:#374151;font-size:15px;">
              A new client has submitted a signup request. Please review and approve.
            </p>
            <table style="width:100%;border-collapse:collapse;margin-top:20px;background:#fff;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:12px;background:#f3f4f6;font-weight:600;width:35%;">Company</td><td style="padding:12px;">${company_name}</td></tr>
              <tr><td style="padding:12px;background:#f3f4f6;font-weight:600;">Owner</td><td style="padding:12px;">${owner_name}</td></tr>
              <tr><td style="padding:12px;background:#f3f4f6;font-weight:600;">Email</td><td style="padding:12px;">${email}</td></tr>
              <tr><td style="padding:12px;background:#f3f4f6;font-weight:600;">Phone</td><td style="padding:12px;">${phone || '—'}</td></tr>
              <tr><td style="padding:12px;background:#f3f4f6;font-weight:600;">City</td><td style="padding:12px;">${city || '—'}</td></tr>
              <tr><td style="padding:12px;background:#f3f4f6;font-weight:600;">Buses</td><td style="padding:12px;">${bus_count || '—'}</td></tr>
              <tr><td style="padding:12px;background:#f3f4f6;font-weight:600;">Message</td><td style="padding:12px;">${message || '—'}</td></tr>
            </table>
            <div style="text-align:center;margin-top:30px;">
              <a href="${process.env.ADMIN_URL || 'http://localhost:5173'}/requests" 
                 style="background:#2563eb;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;">
                Open Admin Panel
              </a>
            </div>
          </div>
          <div style="padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              GM Bus Tracking — Automated Notification
            </p>
          </div>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'Request submitted successfully. Check your email.',
      requestId: result.rows[0].id,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// ===== Check request status =====
exports.checkStatus = async (req, res) => {
  try {
    const { email } = req.params;

    const { rows } = await masterDb.query(
      `SELECT id, company_name, status, created_at 
       FROM signup_requests 
       WHERE email=$1 
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'No request found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
