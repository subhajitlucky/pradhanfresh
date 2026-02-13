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
// Allow multiple origins in development (localhost & 127.0.0.1) and fallback to env variable
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174', // Vite picks next free port if 5173 is occupied
  'http://127.0.0.1:5174',
  'https://pradhanfresh.vercel.app', // Production frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    // In dev tools like curl (no origin) allow
    if (!origin) return callback(null, true);

    // Allow *.vercel.app (preview & production deployments)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // In development, allow any localhost or 127.0.0.1 origin
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      // Origin allowed
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
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

// Import organized route modules
const authRoutes = require('./routes/auth');           // All auth routes
const adminRoutes = require('./routes/admin');         // All admin routes  
const productRoutes = require('./routes/products');    // All product routes
const categoriesRoute = require('./routes/products/categories'); // Categories routes
const cartRoutes = require('./routes/cart');           // All cart routes
const orderRoutes = require('./routes/orders');        // All order routes
const userRoutes = require('./routes/user');           // All user profile routes
const uploadRoutes = require('./routes/upload/imageUpload');
const stripeWebhook = require('./routes/webhooks/stripe');

app.use(cookieParser());
// Note: Webhook needs raw body, so we mount it before express.json() if needed, 
// but our route handler handles it too.
app.use('/api/webhooks/stripe', stripeWebhook);
app.use(express.json()); // Read json data from request body

// Mount organized route modules
app.use('/api/auth', authRoutes);       // All auth endpoints: /api/auth/*
app.use('/api/admin', adminRoutes);     // All admin endpoints: /api/admin/*
app.use('/api/products', productRoutes); // All product endpoints: /api/products/*
app.use('/api/categories', categoriesRoute); // All public category endpoints
app.use('/api/cart', cartRoutes);       // All cart endpoints: /api/cart/*
app.use('/api/orders', orderRoutes);    // All order endpoints: /api/orders/*
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('PradhanFresh backend is running 🥦');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export for Vercel
module.exports = app;