const express = require('express');
const router = express.Router();

// Mock authentication middleware for this router
router.use((req, res, next) => {
  if (!req.headers['apikey']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Set up resource routers for different endpoints
const tablesRouter = require('./tables');
const authRouter = require('./auth'); // for future use

// Mount the resource routers on paths
router.use('/tables', tablesRouter);
router.use('/auth', authRouter); // for future use

// For now, we'll handle all other REST v1 endpoints
// In the future, these should be moved to their own routers

module.exports = router;
