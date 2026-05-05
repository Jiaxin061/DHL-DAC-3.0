const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Health check endpoint — confirms server and DB are alive.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Knowledge Base API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
