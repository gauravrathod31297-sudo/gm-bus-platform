const masterDb = require('../config/database');
const { getTenantDb } = require('../config/tenantDb');

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id);

    // Driver joins (bus device app)
    socket.on('driver:join', async ({ bus_id, client_id, token }) => {
      try {
        const { rows } = await masterDb.query(
          'SELECT db_name FROM clients WHERE id=$1 AND status=$2',
          [client_id, 'approved']
        );
        if (!rows[0]) {
          socket.emit('error', { message: 'Client not found' });
          return;
        }

        const tenantDb = await getTenantDb(rows[0].db_name);
        socket.clientDbName = rows[0].db_name;
        socket.clientId = client_id;
        socket.busId = bus_id;
        socket.join(`bus_${bus_id}`);
        socket.join(`client_${client_id}`);

        console.log(`🚌 Bus ${bus_id} joined (client ${client_id})`);
        socket.emit('joined', { success: true, bus_id, client_id });
      } catch (err) {
        console.error('driver:join error:', err);
        socket.emit('error', { message: err.message });
      }
    });

    // Viewer joins (dashboard + passenger app)
    socket.on('viewer:join', async ({ client_id }) => {
      try {
        socket.join(`client_${client_id}`);
        socket.clientId = client_id;
        console.log(`👀 Viewer joined client ${client_id}`);
        socket.emit('viewer:joined', { success: true, client_id });
      } catch (err) {
        console.error('viewer:join error:', err);
      }
    });

    // Driver sends location
    socket.on('driver:location', async (data) => {
      const { bus_id, client_id, lat, lng, speed, heading } = data;

      try {
        const { rows } = await masterDb.query(
          'SELECT db_name FROM clients WHERE id=$1',
          [client_id]
        );
        if (!rows[0]) return;

        const tenantDb = await getTenantDb(rows[0].db_name);

        // Insert new location
        await tenantDb.query(
          `INSERT INTO live_locations (bus_id, lat, lng, speed, heading, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [bus_id, lat, lng, speed || 0, heading || 0]
        );

        // Keep only latest per bus (cleanup)
        await tenantDb.query(
          `DELETE FROM live_locations 
           WHERE bus_id=$1 AND id NOT IN (
             SELECT id FROM live_locations 
             WHERE bus_id=$1 
             ORDER BY updated_at DESC LIMIT 1
           )`,
          [bus_id]
        );

        // Broadcast to all viewers of this client
        io.to(`client_${client_id}`).emit('bus:location', {
          bus_id,
          lat,
          lng,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('driver:location error:', err.message);
      }
    });

    // Driver announcement (voice)
    socket.on('driver:announcement', (data) => {
      const { client_id, bus_id, stop_id, language, text, audio_url } = data;
      io.to(`client_${client_id}`).emit('announcement:playing', {
        bus_id,
        stop_id,
        language,
        text,
        audio_url,
        timestamp: new Date().toISOString(),
      });
      console.log(`🔊 Announcement on bus ${bus_id}: ${text}`);
    });

    // SOS / Emergency
    socket.on('driver:sos', (data) => {
      const { client_id, bus_id, lat, lng, message } = data;
      io.to(`client_${client_id}`).emit('sos:alert', {
        bus_id,
        lat,
        lng,
        message,
        timestamp: new Date().toISOString(),
      });
      console.log(`🚨 SOS from bus ${bus_id}!`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });
}

module.exports = { initSocket };
