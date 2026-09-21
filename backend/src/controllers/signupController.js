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

    // Validation
    if (!company_name || !email || !owner_name) {
      return res.status(400).json({
        error: 'Company name, owner name, and email are required',
      });
    }

    // Check if already exists
    const existing = await masterDb.query(
      'SELECT id FROM signup_requests WHERE email=$1 AND status=$2',
      [email, 'pending']
    );

    if (existing.rows[0]) {
      return res.status(400).json({
        error: 'You already have a pending request. Please wait for approval.',
      });
    }

    // Save signup request
    const result = await masterDb.query(
      `INSERT INTO signup_requests 
       (company_name, owner_name, email, phone, city, bus_count, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [company_name, owner_name, email, phone, city, bus_count, message]
    );

    // Send confirmation to client
    await sendMail({
      to: email,
      subject: '✅ GM Bus Tracking — Request Received',
      html: `
        <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#2563eb;">नमस्कार ${owner_name},</h2>
          <p>तुमची request आम्हाला मिळाली आहे. 🎉</p>
          <p>आमची team तुमची माहिती तपासून <b>24-48 तासांत</b> approve करेल.</p>
          <p>Approve झाल्यावर तुम्हाला login credentials ईमेल केले जातील.</p>
          <br/>
          <p>धन्यवाद,</p>
          <p><b>GM Bus Tracking Team</b></p>
          <hr/>
          <p style="color:#666;font-size:12px;">
            Request ID: #${result.rows[0].id}<br/>
            bustracker.gauravmedia.in
          </p>
        </div>
      `,
    });

    // Notify admin
    await sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: `🚌 New Client Signup — ${company_name}`,
      html: `
        <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#dc2626;">New Client Interested!</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Company</b></td><td>${company_name}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Owner</b></td><td>${owner_name}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Email</b></td><td>${email}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Phone</b></td><td>${phone || '—'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>City</b></td><td>${city || '—'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Buses</b></td><td>${bus_count || '—'}</td></tr>
            <tr><td style="padding:8px;"><b>Message</b></td><td>${message || '—'}</td></tr>
          </table>
          <br/>
          <a href="${process.env.ADMIN_URL}/requests" 
             style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
            👉 Admin Panel उघडा
          </a>
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
