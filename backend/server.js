const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

const PORT = process.env.PORT || 5000;
const authRoutes = require('./routes/auth');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const profileRoute = require('./routes/profile');
const logoutRoute = require('./routes/logout');
const refreshTokenRoute = require('./routes/refreshToken');

app.use(cookieParser());

app.use(express.json()); //read json data from request body
app.use('/api/auth', authRoutes); //mount the authRoutes at /api/auth
app.use('/api/signup', signupRoute); //mount the signupRoutes at /api/signup
app.use('/api/login', loginRoute); //mount the loginRoutes at /api/login
app.use('/api/profile', profileRoute); //mount the profileRoutes at /api/profile
app.use('/api/logout', logoutRoute); //mount the logoutRoutes at /api/logout
app.use('/api/refresh-token', refreshTokenRoute); //mount the refreshTokenRoutes at /api/refresh-token



app.get('/', (req, res) => {
  res.send('PradhanFresh backend is running 🥦');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export for Vercel
module.exports = app;