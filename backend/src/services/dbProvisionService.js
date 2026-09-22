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

    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gmuser;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gmuser;
  `);
  console.log(`✅ Tables created in ${dbName}`);

  await clientDb.query(`INSERT INTO client_settings DEFAULT VALUES`);

  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await clientDb.query(
    `INSERT INTO users (name, email, password_hash, role) 
     VALUES ($1, $2, $3, 'client_admin')`,
    [ownerName, email, passwordHash]
  );
  console.log(`✅ Admin user created: ${email}`);

  await clientDb.end();

  const masterDb = require('../config/database');
  await masterDb.query(
    `UPDATE clients 
     SET db_name=$1, status='approved', approved_at=NOW() 
     WHERE id=$2`,
    [dbName, clientId]
  );

  // ===== Welcome email (ENGLISH) =====
  await sendMail({
    to: email,
    subject: 'Your GM Bus Tracking Account is Ready!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;padding-bottom:20px;border-bottom:3px solid #10b981;">
          <h1 style="color:#10b981;margin:0;font-size:28px;">🎉 Welcome Aboard!</h1>
        </div>
        <div style="padding:30px 0;">
          <h2 style="color:#111;font-size:22px;">Hello ${ownerName},</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            Great news! Your <b>GM Bus Tracking</b> account has been <b style="color:#10b981;">approved</b>! 🎉
          </p>
          
          <div style="background:#fff;padding:24px;border-radius:8px;border-left:4px solid #10b981;margin:24px 0;">
            <p style="margin:0 0 16px;color:#6b7280;font-size:13px;font-weight:600;">YOUR LOGIN CREDENTIALS</p>
            <p style="margin:0 0 8px;color:#111;font-size:15px;"><b>Company:</b> ${companyName}</p>
            <p style="margin:0 0 8px;color:#111;font-size:15px;"><b>Dashboard URL:</b> <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}" style="color:#2563eb;">${process.env.CLIENT_URL || 'http://localhost:5174'}</a></p>
            <p style="margin:0 0 8px;color:#111;font-size:15px;"><b>Email:</b> ${email}</p>
            <p style="margin:0;color:#111;font-size:15px;"><b>Temporary Password:</b> 
              <code style="background:#fef3c7;padding:8px 16px;border-radius:6px;font-size:16px;font-weight:700;color:#92400e;letter-spacing:1px;">${tempPassword}</code>
            </p>
          </div>

          <div style="background:#fef3c7;padding:16px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0;">
            <p style="margin:0;color:#92400e;font-size:14px;">
              ⚠️ <b>Important:</b> Please change your password immediately after your first login.
            </p>
          </div>

          <h3 style="color:#111;font-size:16px;margin-top:30px;">What's Next?</h3>
          <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;">
            <li>Log in to your dashboard</li>
            <li>Add your buses and drivers</li>
            <li>Create routes with stops (English, Marathi, Gujarati)</li>
            <li>Configure voice announcements</li>
            <li>Start tracking live locations</li>
          </ul>

          <p style="color:#374151;font-size:15px;line-height:1.6;margin-top:24px;">
            If you need any assistance, simply reply to this email. We're here to help!
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

  console.log(`🎉 Client provisioned: ${companyName} (${dbName})`);

  return { dbName, success: true };
}

module.exports = { provisionClientDatabase };
