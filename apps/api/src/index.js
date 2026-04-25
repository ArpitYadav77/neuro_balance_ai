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
  origin: true, // Allow all origins for the demo
  credentials: true,
}));
app.use(express.json());

// Log requests to help debug Vercel routing
app.use((req, _res, next) => {
  console.log(`[NeuroBalance] ${req.method} ${req.url}`);
  next();
});

app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('[NeuroBalance] DB Init Error:', err);
    next();
  }
});

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'neurobalance-backend' }));

// Support both prefixed and non-prefixed routes for Vercel compatibility
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/api', dataRoutes);
app.use('/', dataRoutes);

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
