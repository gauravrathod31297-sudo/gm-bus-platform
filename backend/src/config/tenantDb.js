const { Client } = require('pg');

const tenantPools = {};

async function getTenantDb(dbName) {
  if (tenantPools[dbName]) {
    return tenantPools[dbName];
  }

  const connectionString = process.env.MASTER_DB.replace(
    /\/[^/]+$/,
    '/' + dbName
  );

  const client = new Client({ connectionString });
  await client.connect();

  tenantPools[dbName] = {
    query: (text, params) => client.query(text, params),
    client,
    dbName,
  };

  console.log(`📦 Tenant DB connected: ${dbName}`);
  return tenantPools[dbName];
}

function clearTenantCache(dbName) {
  if (tenantPools[dbName]) {
    tenantPools[dbName].client.end();
    delete tenantPools[dbName];
    console.log(`🔌 Tenant DB disconnected: ${dbName}`);
  }
}

function getAllConnectedTenants() {
  return Object.keys(tenantPools);
}

module.exports = {
  getTenantDb,
  clearTenantCache,
  getAllConnectedTenants,
};
