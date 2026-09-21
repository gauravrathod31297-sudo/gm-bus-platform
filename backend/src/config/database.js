const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.MASTER_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('✅ Master DB connected');
});

pool.on('error', (err) => {
  console.error('❌ Master DB error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
