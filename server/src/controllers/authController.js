/**
 * Authentication Controller
 * Handles user signup and login with security best practices
 * Updated for skillwise_dev schema: full_name, password_hash columns
 */

const User = require('../models/userModel');
const UserProfile = require('../models/userProfileModel');
const { AppError, validateRequest } = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signup = async (req, res) => {
  const { full_name, email, password } = req.body;
  const emailLower = email?.trim().toLowerCase();

  // Support both full_name and name from frontend for backward compat
  const userName = full_name || req.body.name;

  // Validate required fields
  validateRequest({ full_name: userName, email: emailLower, password }, ['full_name', 'email', 'password']);

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    throw new AppError('Please provide a valid email address', 400);
  }

  // Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new AppError('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one allowed special character (@$!%*?&#). Emojis and other symbols are not allowed.', 400);
  }

  // Full name validation
  if (!userName || userName.trim().length < 2) {
    throw new AppError('Please provide a valid full name (at least 2 characters)', 400);
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(emailLower);
  if (existingUser) {
    throw new AppError('User already exists with this email. Please login instead', 409);
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create the user
  try {
    const userId = await User.create(userName.trim(), emailLower, hashedPassword);

    if (!userId) {
      throw new AppError('Failed to create user account', 500);
    }

    // Create empty profile row for the new user (profile_completed = false)
    try {
      await UserProfile.createEmptyProfile(userId);
    } catch (profileError) {
      // Non-fatal: user is created, profile row creation failed
      // Log but don't fail the registration
      console.error('Warning: Failed to create empty profile for user:', userId, profileError.message);
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
  const emailLower = email?.trim().toLowerCase();

  // Validate required fields
  validateRequest({ email: emailLower, password }, ['email', 'password']);

  // Check if user exists
  const user = await User.findByEmail(emailLower);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password against password_hash column
  const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  // Fetch profile to include profile_completed and gender in response
  let profileCompleted = false;
  let gender = null;
  try {
    const profile = await UserProfile.getProfileByUserId(user.id);
    profileCompleted = profile?.profile_completed || false;
    gender = profile?.gender || null;
  } catch (profileError) {
    // Non-fatal: if profile doesn't exist yet, treat as incomplete
    console.warn('Could not fetch profile for login response:', profileError.message);
  }

  // Create JWT token — includes full_name in payload
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );

  // Return user data WITHOUT password
  const userData = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    profile_completed: profileCompleted,
    gender: gender,
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
 * PATCH /api/auth/update-name
 * Update the authenticated user's full_name in the users table.
 * @body { full_name: string }
 */
const updateName = async (req, res) => {
  const userId = req.user.id;
  const { full_name } = req.body;

  if (!full_name || full_name.trim().length < 2) {
    throw new AppError('Full name must be at least 2 characters', 400);
  }
  if (full_name.trim().length > 100) {
    throw new AppError('Full name must be 100 characters or less', 400);
  }

  const db = require('../config/db');
  const [result] = await db.execute(
    'UPDATE users SET full_name = ? WHERE id = ?',
    [full_name.trim(), userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Name updated successfully',
    full_name: full_name.trim()
  });
};

/**
 * POST /api/auth/change-password
 * Verify current password then update to a new bcrypt hash.
 * @body { current_password: string, new_password: string }
 */
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    throw new AppError('Both current_password and new_password are required', 400);
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
  if (!passwordRegex.test(new_password)) {
    throw new AppError('New password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one allowed special character (@$!%*?&#). Emojis and other symbols are not allowed.', 400);
  }
  if (current_password === new_password) {
    throw new AppError('New password must be different from the current password', 400);
  }

  // Fetch current hash
  const db = require('../config/db');
  const [rows] = await db.execute(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  );
  const userRow = rows[0];

  if (!userRow) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isMatch = await bcrypt.compare(current_password, userRow.password_hash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash and save new password
  const newHash = await bcrypt.hash(new_password, 12);
  await db.execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [newHash, userId]
  );

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
};

/**
 * Logout user
 * JWT is stateless, so token is cleared on frontend.
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

/**
 * POST /api/auth/google
 * Verify Google ID token and login/signup user
 */
const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new AppError('Google ID token is required', 400);
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    let { email, name, sub: googleId } = payload;
    const emailLower = email.toLowerCase();

    // Ensure name meets the minimum 2-character requirement (fallback to email prefix)
    if (!name || name.trim().length < 2) {
      name = email.split('@')[0];
      if (name.length < 2) name = "User"; // Ultimate fallback
    }

    let user = await User.findByEmail(emailLower);
    
    if (user) {
      await User.updateGoogleId(user.id, googleId);
    } else {
      const userId = await User.createGoogleUser(name, emailLower, googleId);
      await UserProfile.createEmptyProfile(userId);
      user = await User.findByEmail(emailLower);
    }

    let profileCompleted = false;
    let gender = null;
    try {
      const profile = await UserProfile.getProfileByUserId(user.id);
      profileCompleted = profile?.profile_completed || false;
      gender = profile?.gender || null;
    } catch (profileError) {
      console.warn('Could not fetch profile for google login response:', profileError.message);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      profile_completed: profileCompleted,
      gender: gender,
      created_at: user.created_at
    };

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Google verification error:', error);
    throw new AppError('Invalid Google token', 401);
  }
};

module.exports = { signup, login, logout, updateName, changePassword, googleLogin };
