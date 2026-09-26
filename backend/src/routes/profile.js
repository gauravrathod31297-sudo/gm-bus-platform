const express = require('express');
const router = express.Router();
const masterDb = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/profile — current user info
router.get('/', async (req, res) => {
  try {
    const email = req.user.email;
    if (req.user.role === 'admin') {
      const { rows } = await masterDb.query(
        'SELECT id, email, name FROM admin_users WHERE LOWER(email)=LOWER($1) LIMIT 1',
        [email]
      );
      return res.json({ ...rows[0], type: 'admin' });
    }
    const { rows } = await masterDb.query(
      `SELECT id, company_name, email, phone, address, city, pincode, gstin,
              preferred_language, is_active, last_login
       FROM clients WHERE LOWER(email)=LOWER($1) LIMIT 1`,
      [email]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const c = rows[0];
    res.json({
      id: c.id, type: 'client',
      name: c.company_name, email: c.email, phone: c.phone || '',
      company: c.company_name, address: c.address || '',
      city: c.city || '', pincode: c.pincode || '', gstin: c.gstin || '',
      preferred_language: c.preferred_language, is_active: c.is_active,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/profile — update name + phone
router.put('/', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const email = req.user.email;
    if (req.user.role === 'admin') {
      await masterDb.query(
        'UPDATE admin_users SET name=$1 WHERE LOWER(email)=LOWER($2)',
        [name, email]
      );
    } else {
      await masterDb.query(
        'UPDATE clients SET company_name=$1, phone=$2 WHERE LOWER(email)=LOWER($3)',
        [name, phone || null, email]
      );
    }
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/profile/company
router.get('/company', async (req, res) => {
  try {
    const { rows } = await masterDb.query(
      `SELECT id, company_name, phone, address, city, pincode, gstin
       FROM clients WHERE LOWER(email)=LOWER($1) LIMIT 1`,
      [req.user.email]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Company not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/profile/company
router.put('/company', async (req, res) => {
  try {
    const { company, phone, address, city, pincode, gstin } = req.body;
    if (!company) return res.status(400).json({ error: 'Company name required' });
    await masterDb.query(
      `UPDATE clients SET company_name=$1, phone=$2, address=$3, city=$4,
              pincode=$5, gstin=$6 WHERE LOWER(email)=LOWER($7)`,
      [company, phone || null, address || null, city || null,
       pincode || null, gstin || null, req.user.email]
    );
    res.json({ success: true, message: 'Company updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
