const masterDb = require('../config/database');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { provisionClientDatabase } = require('../services/dbProvisionService');

// ===== Admin login =====
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { rows } = await masterDb.query(
      'SELECT * FROM admin_users WHERE username=$1',
      [username]
    );

    if (!rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: rows[0].id, username: rows[0].username, role: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      admin: { id: rows[0].id, username: rows[0].username, email: rows[0].email },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== List all clients =====
exports.listClients = async (req, res) => {
  try {
    const { rows } = await masterDb.query(
      `SELECT id, company_name, owner_name, email, phone, db_name, 
              status, plan, approved_at, created_at 
       FROM clients 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== List pending signup requests =====
exports.listRequests = async (req, res) => {
  try {
    const { rows } = await masterDb.query(
      `SELECT * FROM signup_requests 
       WHERE status='pending' 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== Approve signup request =====
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const { rows } = await masterDb.query(
      'SELECT * FROM signup_requests WHERE id=$1',
      [requestId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const reqData = rows[0];
    const tempPassword = crypto.randomBytes(6).toString('hex');

    // Create client entry in master
    const clientRes = await masterDb.query(
      `INSERT INTO clients 
       (company_name, owner_name, email, phone, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, company_name, owner_name, email`,
      [
        reqData.company_name,
        reqData.owner_name,
        reqData.email,
        reqData.phone,
        'temp',
      ]
    );

    const client = clientRes.rows[0];

    // Provision client database
    await provisionClientDatabase({
      clientId: client.id,
      companyName: client.company_name,
      ownerName: client.owner_name,
      email: client.email,
      tempPassword,
    });

    // Update request status
    await masterDb.query(
      `UPDATE signup_requests SET status='approved' WHERE id=$1`,
      [requestId]
    );

    res.json({
      success: true,
      message: 'Client approved & database created',
      client,
    });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== Reject signup request =====
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    await masterDb.query(
      `UPDATE signup_requests SET status='rejected' WHERE id=$1`,
      [requestId]
    );

    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== Get client details =====
exports.getClient = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await masterDb.query(
      'SELECT * FROM clients WHERE id=$1',
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const settings = await masterDb.query(
      'SELECT * FROM client_settings WHERE client_id=$1',
      [id]
    );

    res.json({
      client: rows[0],
      settings: settings.rows[0] || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== Update client settings =====
exports.updateClientSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      voice_language,
      announcement_timer,
      map_provider,
      api_key,
    } = req.body;

    const exists = await masterDb.query(
      'SELECT id FROM client_settings WHERE client_id=$1',
      [id]
    );

    if (exists.rows[0]) {
      await masterDb.query(
        `UPDATE client_settings SET 
          smtp_host=$1, smtp_port=$2, smtp_user=$3, smtp_password=$4,
          voice_language=$5, announcement_timer=$6, 
          map_provider=$7, api_key=$8,
          updated_at=NOW()
         WHERE client_id=$9`,
        [
          smtp_host, smtp_port, smtp_user, smtp_password,
          voice_language, announcement_timer,
          map_provider, api_key, id,
        ]
      );
    } else {
      await masterDb.query(
        `INSERT INTO client_settings 
         (client_id, smtp_host, smtp_port, smtp_user, smtp_password,
          voice_language, announcement_timer, map_provider, api_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id, smtp_host, smtp_port, smtp_user, smtp_password,
          voice_language, announcement_timer,
          map_provider, api_key,
        ]
      );
    }

    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== Dashboard stats =====
exports.stats = async (req, res) => {
  try {
    const clients = await masterDb.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status='approved') as approved,
         COUNT(*) FILTER (WHERE status='pending') as pending,
         COUNT(*) FILTER (WHERE status='rejected') as rejected,
         COUNT(*) as total
       FROM clients`
    );

    const requests = await masterDb.query(
      `SELECT COUNT(*) as pending_requests 
       FROM signup_requests WHERE status='pending'`
    );

    res.json({
      clients: clients.rows[0],
      pendingRequests: parseInt(requests.rows[0].pending_requests),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
