const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// --- Security Middleware ---

// 1. Set security-related HTTP headers
app.use(helmet());

// 2. Configure CORS
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend's origin
  credentials: true, // To allow cookies from frontend
};
app.use(cors(corsOptions));

// 3. Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply the rate limiter to all requests
app.use(limiter);

const PORT = process.env.PORT || 5000;
const authRoutes = require('./routes/auth');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const profileRoute = require('./routes/profile');
const logoutRoute = require('./routes/logout');
const refreshTokenRoute = require('./routes/refreshToken');
const adminRoute = require('./routes/admin');

// Middleware for authentication
const requireAuth = require('./middleware/requireAuth');
const requireAdmin = require('./middleware/requireAdmin');

app.use(cookieParser());

app.use(express.json()); //read json data from request body
app.use('/api/auth', authRoutes); //mount the authRoutes at /api/auth
app.use('/api/signup', signupRoute); //mount the signupRoutes at /api/signup
app.use('/api/login', loginRoute); //mount the loginRoutes at /api/login
app.use('/api/profile', requireAuth, profileRoute); //mount the profileRoutes at /api/profile
app.use('/api/logout', logoutRoute); //mount the logoutRoutes at /api/logout
app.use('/api/refresh-token', refreshTokenRoute); //mount the refreshTokenRoutes at /api/refresh-token
app.use('/api/admin', requireAuth, requireAdmin, adminRoute); //mount the adminRoutes at /api/admin

app.get('/', (req, res) => {
  res.send('PradhanFresh backend is running 🥦');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export for Vercel
module.exports = app;