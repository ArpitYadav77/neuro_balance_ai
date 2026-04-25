const { Pool } = require('pg');
const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

let pool;
let isMemDb = false;
let initialized = false;

async function setupPool() {
  const realPool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Test the real connection
    const client = await realPool.connect();
    client.release();
    console.log('[DB] Connected to PostgreSQL successfully.');
    pool = realPool;
  } catch (err) {
    console.warn('[DB] Failed to connect to PostgreSQL. Falling back to in-memory database (pg-mem) for DEMO mode.');
    isMemDb = true;
    
    const mem = newDb();
    mem.public.registerFunction({
      name: 'gen_random_uuid',
      type: 'uuid',
      returns: 'uuid',
      implementation: () => uuidv4(),
    });
    
    // We mock "CREATE EXTENSION" so queries that contain it won't fail
    mem.public.interceptQueries(text => {
      if (text.trim().toUpperCase().startsWith('CREATE EXTENSION')) {
        return []; // Do nothing
      }
      return null;
    });

    const { Pool: MemPool } = mem.adapters.createPg();
    pool = new MemPool();
  }
}

async function initDB() {
  if (initialized) return;
  if (!pool) await setupPool();
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Expected to be ignored by pg-mem interceptor, runs normally on real PG
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        baseline_stress FLOAT DEFAULT 40.0,
        alert_threshold FLOAT DEFAULT 70.0,
        alert_sensitivity VARCHAR(20) DEFAULT 'medium',
        sessions_count INT DEFAULT 0,
        ignore_count INT DEFAULT 0,
        accept_count INT DEFAULT 0,
        snooze_duration_minutes INT DEFAULT 10,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        duration_minutes FLOAT,
        avg_stress FLOAT,
        max_stress FLOAT,
        min_stress FLOAT,
        breaks_taken INT DEFAULT 0,
        alerts_sent INT DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stress_readings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        stress_score FLOAT NOT NULL,
        stress_level VARCHAR(10) NOT NULL,
        blink_rate FLOAT,
        gaze_direction VARCHAR(10),
        eye_closure FLOAT,
        screen_time_minutes FLOAT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS interventions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        triggered_at TIMESTAMPTZ DEFAULT NOW(),
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        trigger_reason VARCHAR(100),
        response VARCHAR(20),
        responded_at TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS behavior_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        logged_at TIMESTAMPTZ DEFAULT NOW(),
        event_type VARCHAR(50) NOT NULL,
        metadata JSONB
      )
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stress_readings_user
        ON stress_readings(user_id, timestamp DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user
        ON sessions(user_id, started_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interventions_user
        ON interventions(user_id, triggered_at DESC)
    `);

    // Seed Demo Account
    const demoEmail = 'demo@neurobalance.ai';
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [demoEmail]);
    
    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash('demo', 12);
      const res = await client.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
        [demoEmail, hash, 'Demo User']
      );
      await client.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [res.rows[0].id]);
      console.log(`[DB] Demo account created. Login with ${demoEmail} / demo`);
    }

    await client.query('COMMIT');
    initialized = true;
    console.log('[DB] Schema initialized successfully');
  } catch (err) {
    if (!isMemDb) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (!isMemDb) client.release();
  }
}

// Create a proxy so routes using \`pool.connect()\` get the right object
const poolProxy = new Proxy({}, {
  get(target, prop) {
    if (pool) {
      return typeof pool[prop] === 'function' ? pool[prop].bind(pool) : pool[prop];
    }
    throw new Error("Pool not initialized yet");
  }
});

module.exports = { pool: poolProxy, initDB };
