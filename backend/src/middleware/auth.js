const jwt = require('jsonwebtoken');

/** Requires a valid `Authorization: Bearer <token>` (or `x-access-token`) header. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearerToken || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Your session has expired — please log in again.' });
  }
}

module.exports = { requireAuth };
