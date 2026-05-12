require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { initializeDatabase } = require('./config/initDb');
const healthRouter   = require('./routes/health');
const articlesRouter = require('./routes/articles');
const uploadRouter   = require('./routes/upload');
const authRouter     = require('./routes/auth');
const draftRouter    = require('./routes/draft');
const rawTextRouter  = require('./routes/rawText');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());                          // Allow requests from any origin (dev)
app.use(express.json());                  // Parse incoming JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health',       healthRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/upload',   uploadRouter);
app.use('/api/login',    authRouter);
app.use('/api/draft',    draftRouter);
app.use('/api/raw-text', rawTextRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start Server ──────────────────────────────────────────────────────────────
initializeDatabase(); // Create tables if they don't exist

app.listen(PORT, () => {
  console.log(`\n🚀 Knowledge Base API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health\n`);
});
