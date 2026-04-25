const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

async function run() {
  const mem = newDb();
  
  // Register uuid function
  mem.public.registerFunction({
    name: 'gen_random_uuid',
    type: 'uuid',
    returns: 'uuid',
    implementation: x => uuidv4(),
  });

  const { Pool } = mem.adapters.createPg();
  const pool = new Pool();
  
  const client = await pool.connect();
  // bypass extension creation
  await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
  `);
  
  await client.query(`INSERT INTO users (email, password_hash) VALUES ('test@test.com', 'hash')`);
  const res = await client.query('SELECT * FROM users');
  console.log(res.rows);
}
run().catch(console.error);
