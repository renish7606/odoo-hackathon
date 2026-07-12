const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

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
 * Role validation is DB-driven — no hardcoded email lists.
 */
const DB_ROLE_MAP = {
  'Fleet Manager': 'FleetManager',
  'Safety Officer': 'SafetyOfficer',
  'Financial Analyst': 'FinancialAnalyst',
  'Dispatcher': 'Driver'
};

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Find user by email (DB-driven, no hardcoded allow-list)
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Validate the selected role if provided
  if (role) {
    const dbRole = DB_ROLE_MAP[role];
    if (!dbRole || user.role !== dbRole) {
      return res.status(401).json({ error: 'Access denied. Incorrect role selected for this email.' });
    }
  }

  // Check if account is locked
  if (user.is_locked) {
    return res.status(403).json({
      error: 'Account is locked due to too many failed login attempts. Please contact support.',
    });
  }

  // Compare password against stored hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const failedAttempts = user.failed_attempts + 1;
    const isLocked = failedAttempts >= 5;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failed_attempts: failedAttempts,
        is_locked: isLocked,
      },
    });

    if (isLocked) {
      return res.status(403).json({
        error: 'Invalid email or password. Your account has been locked due to 5 failed login attempts.',
      });
    }

    const remainingAttempts = 5 - failedAttempts;
    return res.status(401).json({
      error: `Invalid email or password. You have ${remainingAttempts} attempts remaining before your account is locked.`,
    });
  }

  // If password matches, reset failed attempts
  if (user.failed_attempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failed_attempts: 0 },
    });
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
