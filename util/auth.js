const jwt = require('jsonwebtoken');
const { getProjectConfig } = require('./db');

function authorizeRole(requiredRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jwtSecret } = getProjectConfig(req.projectName);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, authorizeRole };
