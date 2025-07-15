const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.use((req, res, next) => {
  const projectName = req.headers['x-project-name'];
  
  if (!projectName) {
    return res.status(400).json({ error: 'Missing X-Project-Name header' });
  }
  
  req.projectName = projectName;
  next();
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const tablesRouter = require('./tables');
const authRouter = require('./auth');

router.use('/tables', authenticateToken, tablesRouter);
router.use('/auth', authRouter);

module.exports = router;
