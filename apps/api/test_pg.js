const { Client } = require('pg');

const passwords = ['postgres', 'admin', 'root', '1234', 'password', '', 'arpit'];

async function testPostgres() {
  for (const pw of passwords) {
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      password: pw,
      port: 5432,
    });
    try {
      await client.connect();
      console.log(`[SUCCESS] Connected with user "postgres" and password "${pw}"`);
      await client.end();
      return;
    } catch (e) {
      console.log(`[FAILED] user "postgres", password "${pw}"`);
    }
  }
}

testPostgres();
