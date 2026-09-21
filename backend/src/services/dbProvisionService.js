const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { sendMail } = require('../config/mailer');

async function provisionClientDatabase({
  clientId,
  companyName,
  ownerName,
  email,
  tempPassword,
}) {
  const dbName = `client_${clientId}_${Date.now()}`;

  console.log(`🔧 Provisioning DB: ${dbName}`);

  // 1. Create database
  const adminConn = new Client({ connectionString: process.env.MASTER_DB });
  await adminConn.connect();
  await adminConn.query(`CREATE DATABASE ${dbName}`);
  await adminConn.end();
  console.log(`✅ Database created: ${dbName}`);

  // 2. Connect to new DB
  const connStr = process.env.MASTER_DB.replace(/\/[^/]+$/, '/' + dbName);
  const clientDb = new Client({ connectionString: connStr });
  await clientDb.connect();

  // 3. Create tables
  await clientDb.query(`
    CREATE TABLE IF NOT EXISTS buses (
      id SERIAL PRIMARY KEY,
      bus_number VARCHAR(20) UNIQUE NOT NULL,
      driver_name VARCHAR(100),
      driver_phone VARCHAR(20),
      route_id INT,
      capacity INT DEFAULT 40,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      route_name VARCHAR(100) NOT NULL,
      start_point VARCHAR(150),
      end_point VARCHAR(150),
      start_lat DECIMAL(10,7),
      start_lng DECIMAL(10,7),
      end_lat DECIMAL(10,7),
      end_lng DECIMAL(10,7),
      distance_km DECIMAL(6,2),
      estimated_minutes INT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stops (
      id SERIAL PRIMARY KEY,
      route_id INT REFERENCES routes(id) ON DELETE CASCADE,
      stop_name VARCHAR(150) NOT NULL,
      stop_name_mr VARCHAR(150),
      stop_name_gu VARCHAR(150),
      lat DECIMAL(10,7),
      lng DECIMAL(10,7),
      stop_order INT,
      announcement_text TEXT
    );

    CREATE TABLE IF NOT EXISTS live_locations (
      id SERIAL PRIMARY KEY,
      bus_id INT REFERENCES buses(id) ON DELETE CASCADE,
      lat DECIMAL(10,7),
      lng DECIMAL(10,7),
      speed DECIMAL(5,2) DEFAULT 0,
      heading DECIMAL(5,2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_live_bus ON live_locations(bus_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(150) UNIQUE,
      phone VARCHAR(20),
      password_hash VARCHAR(255),
      role VARCHAR(20) DEFAULT 'client_admin',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      bus_id INT,
      stop_id INT,
      language VARCHAR(10),
      text TEXT,
      audio_url TEXT,
      played_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id SERIAL PRIMARY KEY,
      user_id INT,
      bus_id INT,
      type VARCHAR(20),
      message TEXT,
      sent_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS client_settings (
      id SERIAL PRIMARY KEY,
      smtp_host VARCHAR(100),
      smtp_port INT,
      smtp_user VARCHAR(100),
      smtp_password VARCHAR(255),
      voice_language VARCHAR(20) DEFAULT 'mr',
      announcement_timer INT DEFAULT 15,
      map_provider VARCHAR(50) DEFAULT 'mapbox',
      api_key TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log(`✅ Tables created in ${dbName}`);

  // 4. Default settings
  await clientDb.query(`INSERT INTO client_settings DEFAULT VALUES`);

  // 5. Create admin user
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await clientDb.query(
    `INSERT INTO users (name, email, password_hash, role) 
     VALUES ($1, $2, $3, 'client_admin')`,
    [ownerName, email, passwordHash]
  );
  console.log(`✅ Admin user created: ${email}`);

  await clientDb.end();

  // 6. Update master DB
  const masterDb = require('../config/database');
  await masterDb.query(
    `UPDATE clients 
     SET db_name=$1, status='approved', approved_at=NOW() 
     WHERE id=$2`,
    [dbName, clientId]
  );

  // 7. Send welcome email
  await sendMail({
    to: email,
    subject: '🎉 Your GM Bus Tracking Account is Ready!',
    html: `
      <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
        <h2 style="color:#2563eb;">नमस्कार ${ownerName},</h2>
        <p>तुमचं <b>GM Bus Tracking</b> account approve झालं आहे! 🎉</p>
        <p><b>Company:</b> ${companyName}</p>
        <p><b>Dashboard:</b> <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Temporary Password:</b> 
          <code style="background:#f3f4f6;padding:6px 12px;border-radius:4px;font-size:16px;">${tempPassword}</code>
        </p>
        <p>कृपया लॉगिन केल्यावर password बदला.</p>
        <hr/>
        <p style="color:#666;font-size:12px;">GM Bus Tracking — bustracker.gauravmedia.in</p>
      </div>
    `,
  });

  console.log(`🎉 Client provisioned: ${companyName} (${dbName})`);

  return { dbName, success: true };
}

module.exports = { provisionClientDatabase };
