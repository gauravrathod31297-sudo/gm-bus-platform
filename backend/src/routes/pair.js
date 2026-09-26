const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const masterDb = require('../config/database');
const { getTenantDb } = require('../config/tenantDb');

function pairingToken(busNumber) {
  const secret = process.env.JWT_SECRET || 'gm-dev-secret';
  return crypto.createHmac('sha256', secret)
    .update(String(busNumber)).digest('hex').slice(0, 10).toUpperCase();
}

function timingSafeEq(a, b) {
  const A = Buffer.from(String(a || ''));
  const B = Buffer.from(String(b || ''));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

router.post('/pair', async (req, res) => {
  try {
    const { client_id, bus_number, pairing_token, device_uuid, platform, app_version } = req.body;
    if (!client_id || !bus_number || !pairing_token || !device_uuid) {
      return res.status(400).json({ error: 'client_id, bus_number, pairing_token, device_uuid required' });
    }
    const { rows: clients } = await masterDb.query(
      'SELECT id, db_name, status FROM clients WHERE id=$1', [client_id]
    );
    if (!clients[0]) return res.status(404).json({ error: 'Client not found' });
    if (clients[0].status !== 'approved') return res.status(403).json({ error: 'Client not approved' });
    if (!clients[0].db_name) return res.status(400).json({ error: 'Client DB not provisioned' });

    if (!timingSafeEq(pairingToken(bus_number), pairing_token)) {
      return res.status(401).json({ error: 'Invalid pairing token' });
    }
    const tenantDb = await getTenantDb(clients[0].db_name);
    const { rows: buses } = await tenantDb.query(
      'SELECT id, bus_number FROM buses WHERE bus_number=$1', [bus_number]
    );
    if (!buses[0]) return res.status(404).json({ error: 'Bus not found' });
    const busId = buses[0].id;

    const { rows: devs } = await tenantDb.query(
      `INSERT INTO devices (bus_id, device_uuid, platform, app_version, last_seen_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (device_uuid) DO UPDATE
         SET bus_id=EXCLUDED.bus_id, platform=EXCLUDED.platform,
             app_version=EXCLUDED.app_version, last_seen_at=NOW(), revoked_at=NULL
       RETURNING id, bus_id, device_uuid`,
      [busId, device_uuid, platform || null, app_version || null]
    );
    const device = devs[0];

    const device_token = jwt.sign(
      { role: 'device', client_id: Number(client_id), bus_id: busId,
        device_id: device.id, device_uuid },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({
      success: true, device_token, bus_id: busId,
      bus_number: buses[0].bus_number, client_id: Number(client_id), device_id: device.id,
    });
  } catch (err) {
    console.error('pair error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
