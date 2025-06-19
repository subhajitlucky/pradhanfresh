const express = require('express');
const app = express();
const PORT = 5000;
const authRoutes = require('./routes/auth');
const signupRoutes = require('./routes/signup');

app.use(express.json()); //read json data from request body
app.use('/api/auth', authRoutes); //mount the authRoutes at /api/auth
app.use('/api/signup', signupRoutes); //mount the signupRoutes at /api/signup

app.get('/', (req, res) => {
  res.send('PradhanFresh backend is running 🥦');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});