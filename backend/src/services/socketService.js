const jwt = require('jsonwebtoken');
const masterDb = require('../config/database');
const { getTenantDb } = require('../config/tenantDb');

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id);

    socket.on('driver:join', async ({ device_token }) => {
      try {
        const decoded = jwt.verify(device_token, process.env.JWT_SECRET);
        if (decoded.role !== 'device') throw new Error('Not a device token');

        const { rows } = await masterDb.query(
          'SELECT db_name, status FROM clients WHERE id=$1', [decoded.client_id]
        );
        if (!rows[0] || rows[0].status !== 'approved') throw new Error('Client not approved');

        const tenantDb = await getTenantDb(rows[0].db_name);
        const { rows: devs } = await tenantDb.query(
          'SELECT id, revoked_at FROM devices WHERE id=$1', [decoded.device_id]
        );
        if (!devs[0] || devs[0].revoked_at) throw new Error('Device revoked');

        await tenantDb.query('UPDATE devices SET last_seen_at=NOW() WHERE id=$1', [decoded.device_id]);

        socket.clientDbName = rows[0].db_name;
        socket.clientId = decoded.client_id;
        socket.busId = decoded.bus_id;
        socket.deviceId = decoded.device_id;
        socket.join(`bus_${decoded.bus_id}`);
        socket.join(`client_${decoded.client_id}`);

        console.log(`🚌 Bus ${decoded.bus_id} joined (client ${decoded.client_id})`);
        socket.emit('joined', { success: true, bus_id: decoded.bus_id, client_id: decoded.client_id });
      } catch (err) {
        console.error('driver:join error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('viewer:join', async ({ client_id }) => {
      socket.join(`client_${client_id}`);
      socket.clientId = client_id;
      socket.emit('viewer:joined', { success: true, client_id });
    });

    socket.on('driver:location', async (data) => {
      if (!socket.deviceId) return socket.emit('error', { message: 'Not paired' });
      const { lat, lng, speed, heading } = data;
      try {
        const tenantDb = await getTenantDb(socket.clientDbName);
        await tenantDb.query(
          `INSERT INTO live_locations (bus_id, lat, lng, speed, heading, updated_at)
           VALUES ($1,$2,$3,$4,$5,NOW())`,
          [socket.busId, lat, lng, speed || 0, heading || 0]
        );
        await tenantDb.query(
          `DELETE FROM live_locations WHERE bus_id=$1 AND id NOT IN (
             SELECT id FROM live_locations WHERE bus_id=$1 ORDER BY updated_at DESC LIMIT 1)`,
          [socket.busId]
        );
        const payload = {
          bus_id: socket.busId, lat, lng,
          speed: speed || 0, heading: heading || 0,
          last_update: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };
        io.to(`client_${socket.clientId}`).emit('bus:update', payload);
        io.to(`client_${socket.clientId}`).emit('bus:location', payload);
      } catch (err) {
        console.error('driver:location error:', err.message);
      }
    });

    socket.on('driver:announcement', (data) => {
      if (!socket.deviceId) return;
      io.to(`client_${socket.clientId}`).emit('announcement:playing', {
        bus_id: socket.busId, ...data, timestamp: new Date().toISOString(),
      });
    });

    socket.on('driver:sos', (data) => {
      if (!socket.deviceId) return;
      io.to(`client_${socket.clientId}`).emit('sos:alert', {
        bus_id: socket.busId, ...data, timestamp: new Date().toISOString(),
      });
      console.log(`🚨 SOS from bus ${socket.busId}!`);
    });

    socket.on('disconnect', () => console.log('❌ Socket disconnected:', socket.id));
  });
}

module.exports = { initSocket };
