/**
 * Authentication Controller
 * Handles user signup and login with security best practices
 */

const User = require('../models/userModel');
const { AppError, validateRequest } = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate required fields
  validateRequest(req.body, ['name', 'email', 'password']);

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address', 400);
  }

  // Password strength validation
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError('User already exists with this email. Please login instead', 409);
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create the user
  try {
    const userId = await User.create(name, email, hashedPassword);
    
    if (!userId) {
      throw new AppError('Failed to create user account', 500);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully. You can now login.',
      userId
    });
  } catch (error) {
    // Check if it's a duplicate key error from database
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('This email is already registered. Please login instead', 409);
    }
    throw error;
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  validateRequest(req.body, ['email', 'password']);

  // Check if user exists
  const user = await User.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  // Create JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );

  // Return user data WITHOUT password
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: userData,
    token
  });
};

/**
 * Logout user
 * Endpoint for clean logout (mainly for frontend notification)
 * JWT is stateless, so token is cleared on frontend
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  // JWT is stateless, so logout happens on client side by removing token
  // This endpoint can be used for logging/audit purposes
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = { signup, login, logout };
