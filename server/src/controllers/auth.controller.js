const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const prisma = new PrismaClient();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

/**
 * POST /api/auth/register
 * Register a new user with email, password, and role.
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // Hash password with bcryptjs (12 salt rounds)
  const password_hash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: { email, password_hash, role },
    select: { id: true, email: true, role: true },
  });

  // Generate JWT
  const token = generateToken(user);

  // Log activity
  await prisma.activity.create({
    data: { text: `New user registered: ${email} (${role})` },
  });

  res.status(201).json({ token, user });
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Compare password against stored hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Generate JWT
  const token = generateToken(user);

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

/**
 * GET /api/auth/me
 * Get current user profile from JWT.
 */
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, getMe };
