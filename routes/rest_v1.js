const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../util/auth');

router.use((req, res, next) => {
  const projectName = req.headers['x-project-name'];
  
  if (!projectName) {
    return res.status(400).json({ error: 'Missing X-Project-Name header' });
  }
  
  req.projectName = projectName;
  next();
});

const tablesRouter = require('./tables');
const authRouter = require('./auth');
const usersRouter = require('./users');

router.use('/tables', authenticateToken, tablesRouter);
router.use('/auth', authRouter);
router.use('/users', authenticateToken, usersRouter);

module.exports = router;
