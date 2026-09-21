const masterDb = require('../config/database');
const { getTenantDb } = require('../config/tenantDb');

module.exports = async (req, res, next) => {
  try {
    const clientId = req.user?.client_id;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID missing in token' });
    }

    const { rows } = await masterDb.query(
      'SELECT db_name, status FROM clients WHERE id=$1',
      [clientId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (rows[0].status !== 'approved') {
      return res.status(403).json({
        error: 'Client account not approved',
        status: rows[0].status,
      });
    }

    req.tenantDb = await getTenantDb(rows[0].db_name);
    req.clientDbName = rows[0].db_name;
    req.clientId = clientId;

    next();
  } catch (err) {
    console.error('Tenant middleware error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
};
