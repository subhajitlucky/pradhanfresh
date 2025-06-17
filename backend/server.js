const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to PradhanFresh API',
    version: '1.0.0',
    status: 'Server is running successfully'
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Products route (placeholder)
app.get('/api/products', (req, res) => {
  res.json({ 
    message: 'Products endpoint - Coming soon',
    data: []
  });
});

// Users route (placeholder)
app.get('/api/users', (req, res) => {
  res.json({ 
    message: 'Users endpoint - Coming soon',
    data: []
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PradhanFresh API server is running on port ${PORT}`);
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
}); 