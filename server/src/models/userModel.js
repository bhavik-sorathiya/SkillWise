// server/src/models/userModel.js
// Handles DB operations for the users table.
// New schema columns: full_name (was: name), password_hash (was: password)

const db = require('../config/db');

const User = {
  /**
   * Create a new user record
   * @param {string} fullName - User's full name
   * @param {string} email - User's email
   * @param {string} passwordHash - Bcrypt hashed password
   * @returns {Promise<number>} Inserted user ID
   */
  create: async (fullName, email, passwordHash) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, cleanEmail, passwordHash]
    );
    return result.insertId;
  },

  /**
   * Find user by email address
   * @param {string} email - User's email
   * @returns {Promise<Object|undefined>} User row (includes full_name, password_hash)
   */
  findByEmail: async (email) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE LOWER(email) = ?',
      [cleanEmail]
    );
    return rows[0];
  },

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|undefined>} User row
   */
  findById: async (id) => {
    const [rows] = await db.execute(
      'SELECT id, full_name, email, is_verified, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }
};

module.exports = User;
