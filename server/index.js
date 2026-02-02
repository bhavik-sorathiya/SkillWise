// server/index.js
// Make sure you have installed express, cors, and dotenv
// npm install express cors dotenv

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Welcome to SkillWise API');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
