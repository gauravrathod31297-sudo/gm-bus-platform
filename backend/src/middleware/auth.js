const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireClientAdmin(req, res, next) {
  if (!req.user || !['client_admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Client admin access required' });
  }
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Ignore invalid token
    }
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin,
  requireClientAdmin,
  optionalAuth,
};
