require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db');
const { initWebSocket } = require('./services/websocket');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');

const app = express();
const server = createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'neurobalance-backend' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', dataRoutes);

// ── WebSocket ─────────────────────────────────────────────────────────────────
initWebSocket(server);

// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

// Export app for serverless deployments (like Vercel)
module.exports = app;

if (require.main === module) {
  (async () => {
    try {
      await initDB();
      server.listen(PORT, () => {
        console.log(`[NeuroBalance] Backend running on port ${PORT}`);
      });
    } catch (err) {
      console.error('[NeuroBalance] Failed to start:', err);
      process.exit(1);
    }
  })();
}
