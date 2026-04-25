const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── POST /api/sessions/start ──────────────────────────────────────────────────
router.post('/sessions/start', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO sessions (user_id) VALUES ($1) RETURNING *',
      [req.user.id],
    );
    return res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error('[sessions/start]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── POST /api/sessions/:id/end ────────────────────────────────────────────────
router.post('/sessions/:id/end', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    // Compute stats from readings
    const statsResult = await client.query(
      `SELECT
         AVG(stress_score) as avg_stress,
         MAX(stress_score) as max_stress,
         MIN(stress_score) as min_stress,
         COUNT(*) as reading_count
       FROM stress_readings WHERE session_id = $1`,
      [id],
    );
    const stats = statsResult.rows[0];

    const sessionResult = await client.query(
      'SELECT started_at FROM sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.id],
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const startedAt = new Date(sessionResult.rows[0].started_at);
    const endedAt = new Date();
    const durationMinutes = (endedAt - startedAt) / 60000;

    const updated = await client.query(
      `UPDATE sessions
       SET ended_at = $1, duration_minutes = $2, avg_stress = $3,
           max_stress = $4, min_stress = $5
       WHERE id = $6 RETURNING *`,
      [
        endedAt.toISOString(),
        parseFloat(durationMinutes.toFixed(2)),
        stats.avg_stress ? parseFloat(parseFloat(stats.avg_stress).toFixed(2)) : null,
        stats.max_stress ? parseFloat(parseFloat(stats.max_stress).toFixed(2)) : null,
        stats.min_stress ? parseFloat(parseFloat(stats.min_stress).toFixed(2)) : null,
        id,
      ],
    );

    // Update sessions_count in profile
    await client.query(
      'UPDATE user_profiles SET sessions_count = sessions_count + 1, updated_at = NOW() WHERE user_id = $1',
      [req.user.id],
    );

    // Personalization: rolling baseline from last 5 sessions
    const last5 = await client.query(
      `SELECT avg_stress FROM sessions
       WHERE user_id = $1 AND avg_stress IS NOT NULL
       ORDER BY started_at DESC LIMIT 5`,
      [req.user.id],
    );
    if (last5.rows.length > 0) {
      const rollingBaseline =
        last5.rows.reduce((acc, r) => acc + parseFloat(r.avg_stress), 0) / last5.rows.length;
      await client.query(
        'UPDATE user_profiles SET baseline_stress = $1 WHERE user_id = $2',
        [parseFloat(rollingBaseline.toFixed(2)), req.user.id],
      );
    }

    // Personalization: adjust threshold based on ignore vs accept ratio
    const profile = await client.query(
      'SELECT ignore_count, accept_count, alert_threshold FROM user_profiles WHERE user_id = $1',
      [req.user.id],
    );
    if (profile.rows.length > 0) {
      const { ignore_count, accept_count, alert_threshold } = profile.rows[0];
      let newThreshold = parseFloat(alert_threshold);
      if (ignore_count > accept_count && ignore_count > 5) {
        newThreshold = Math.min(90, newThreshold + 2);
      } else if (accept_count > ignore_count && accept_count > 5) {
        newThreshold = Math.max(50, newThreshold - 1);
      }
      await client.query(
        'UPDATE user_profiles SET alert_threshold = $1 WHERE user_id = $2',
        [newThreshold, req.user.id],
      );
    }

    return res.json({ session: updated.rows[0] });
  } catch (err) {
    console.error('[sessions/end]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── POST /api/readings ────────────────────────────────────────────────────────
router.post('/readings', async (req, res) => {
  const { sessionId, stressScore, stressLevel, blinkRate, gazeDirection, eyeClosure, screenTimeMinutes } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO stress_readings
         (session_id, user_id, stress_score, stress_level, blink_rate, gaze_direction, eye_closure, screen_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [sessionId, req.user.id, stressScore, stressLevel, blinkRate, gazeDirection, eyeClosure, screenTimeMinutes],
    );
    return res.status(201).json({ reading: result.rows[0] });
  } catch (err) {
    console.error('[readings]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── GET /api/analytics ────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;

    // Hourly readings (last 24h)
    const hourlyResult = await client.query(
      `SELECT
         date_trunc('hour', timestamp) as hour,
         AVG(stress_score) as avg_score,
         COUNT(*) as reading_count
       FROM stress_readings
       WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '24 hours'
       GROUP BY hour ORDER BY hour ASC`,
      [userId],
    );

    // Weekly average (last 7 days)
    const weeklyResult = await client.query(
      `SELECT
         date_trunc('day', started_at) as day,
         AVG(avg_stress) as avg_stress,
         COUNT(*) as session_count
       FROM sessions
       WHERE user_id = $1 AND started_at > NOW() - INTERVAL '7 days' AND avg_stress IS NOT NULL
       GROUP BY day ORDER BY day ASC`,
      [userId],
    );

    // Latest session
    const latestSession = await client.query(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1',
      [userId],
    );

    // Profile
    const profileResult = await client.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId],
    );

    // Today stats
    const todayResult = await client.query(
      `SELECT
         AVG(stress_score) as avg_stress,
         MAX(stress_score) as max_stress,
         MIN(stress_score) as min_stress,
         COUNT(DISTINCT session_id) as session_count
       FROM stress_readings
       WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '24 hours'`,
      [userId],
    );

    // Recent interventions
    const interventionsResult = await client.query(
      `SELECT * FROM interventions
       WHERE user_id = $1 ORDER BY triggered_at DESC LIMIT 5`,
      [userId],
    );

    return res.json({
      hourly: hourlyResult.rows,
      weekly: weeklyResult.rows,
      latestSession: latestSession.rows[0] || null,
      profile: profileResult.rows[0] || null,
      today: todayResult.rows[0] || null,
      recentInterventions: interventionsResult.rows,
    });
  } catch (err) {
    console.error('[analytics]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── POST /api/interventions ───────────────────────────────────────────────────
router.post('/interventions', async (req, res) => {
  const { sessionId, type, message, triggerReason } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO interventions (session_id, user_id, type, message, trigger_reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sessionId, req.user.id, type, message, triggerReason],
    );
    return res.status(201).json({ intervention: result.rows[0] });
  } catch (err) {
    console.error('[interventions]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── PATCH /api/interventions/:id/respond ─────────────────────────────────────
router.patch('/interventions/:id/respond', async (req, res) => {
  const { id } = req.params;
  const { response } = req.body; // "accepted" | "ignored" | "snoozed"
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE interventions
       SET response = $1, responded_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [response, id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    // Update behavior counters
    if (response === 'accepted') {
      await client.query(
        'UPDATE user_profiles SET accept_count = accept_count + 1 WHERE user_id = $1',
        [req.user.id],
      );
    } else if (response === 'ignored') {
      await client.query(
        'UPDATE user_profiles SET ignore_count = ignore_count + 1 WHERE user_id = $1',
        [req.user.id],
      );
    }

    // Log behavior
    await client.query(
      `INSERT INTO behavior_logs (user_id, event_type, metadata)
       VALUES ($1, 'intervention_response', $2)`,
      [req.user.id, JSON.stringify({ interventionId: id, response })],
    );

    return res.json({ intervention: result.rows[0] });
  } catch (err) {
    console.error('[interventions/respond]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── PATCH /api/settings ───────────────────────────────────────────────────────
router.patch('/settings', async (req, res) => {
  const { alertThreshold, alertSensitivity, snoozeDurationMinutes } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE user_profiles
       SET alert_threshold = COALESCE($1, alert_threshold),
           alert_sensitivity = COALESCE($2, alert_sensitivity),
           snooze_duration_minutes = COALESCE($3, snooze_duration_minutes),
           updated_at = NOW()
       WHERE user_id = $4 RETURNING *`,
      [alertThreshold, alertSensitivity, snoozeDurationMinutes, req.user.id],
    );
    return res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('[settings]', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
