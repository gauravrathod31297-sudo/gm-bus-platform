const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const masterDb = require('../config/database');
const { getTenantDb } = require('../config/tenantDb');

// ===== Client user login =====
exports.clientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find approved client
    const { rows: clients } = await masterDb.query(
      `SELECT * FROM clients WHERE email=$1 AND status='approved'`,
      [email]
    );

    if (!clients[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const client = clients[0];
    const tenantDb = await getTenantDb(client.db_name);

    // Find user in client DB
    const { rows: users } = await tenantDb.query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    );

    if (!users[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, users[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        client_id: client.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );

    res.json({
      token,
      user: {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        role: users[0].role,
        company: client.company_name,
        company_id: client.id,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ===== Change password =====
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const clientId = req.user.client_id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { rows: clients } = await masterDb.query(
      'SELECT db_name FROM clients WHERE id=$1',
      [clientId]
    );

    const tenantDb = await getTenantDb(clients[0].db_name);

    const { rows: users } = await tenantDb.query(
      'SELECT * FROM users WHERE id=$1',
      [req.user.id]
    );

    const valid = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is wrong' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await tenantDb.query(
      'UPDATE users SET password_hash=$1 WHERE id=$2',
      [hash, req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== Get current user =====
exports.me = async (req, res) => {
  try {
    const { rows: clients } = await masterDb.query(
      'SELECT id, company_name, email FROM clients WHERE id=$1',
      [req.user.client_id]
    );

    res.json({
      user: req.user,
      company: clients[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== Logout (client-side token removal) =====
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
};
