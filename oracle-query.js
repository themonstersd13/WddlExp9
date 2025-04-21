require('dotenv').config();
const oracledb = require('oracledb');
const path = require('path');


oracledb.initOracleClient({
  libDir: process.env.ORACLE_CLIENT_LIB
});


const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING
};

async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    console.log('✅ Connected to Oracle (Thick mode)');

    const result = await conn.execute(
      `SELECT table_name FROM user_tables`
    );

    console.log('📦 Query Results:');
    console.table(result.rows);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (conn) {
      try { await conn.close(); }
      catch (e) { console.error('❌ Close Error:', e); }
    }
  }
}

run();
