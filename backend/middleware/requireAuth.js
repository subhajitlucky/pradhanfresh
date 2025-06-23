const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

const requireAuth = (req, res, next) => {
  // ✅ Step 0: Check if ACCESS_SECRET exists
  if (!ACCESS_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: JWT secret not found' });
  }
  
  const authHeader = req.headers.authorization;

  // ✅ Step 1: Check if token exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // ✅ Step 2: Verify token
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // ✅ Step 3: Attach user to request
    req.user = decoded;
    next(); // 🔁 go to next middleware or route handler

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = requireAuth;
