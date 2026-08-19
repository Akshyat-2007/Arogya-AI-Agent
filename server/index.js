const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { testConnection, UserRepository } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Run DB connection test
testConnection();

// JWT verification middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'arogya_ai_super_secret_jwt_key_2026');
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(403).json({ error: 'Invalid or tampered token.' });
  }
};

// Input validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ----------------------------------------------------
// AUTHENTICATION API ROUTES
// ----------------------------------------------------

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = await UserRepository.create({
      email: trimmedEmail,
      username: username ? username.trim() : null,
      hashedPassword
    });

    const user = await UserRepository.findById(userId);

    // Generate JWT token automatically on signup
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'arogya_ai_super_secret_jwt_key_2026',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim();
    const user = await UserRepository.findByEmail(trimmedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'arogya_ai_super_secret_jwt_key_2026',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  // In stateless JWT architectures, token invalidation occurs client-side (removing the token).
  // This endpoint returns a successful response confirming the logout instruction.
  res.json({ success: true, message: 'Logged out successfully. Please remove your token client-side.' });
});

// Global central error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({
    error: 'Internal server error. Please try again later.'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Express Authentication Server running on port ${PORT}`);
});
