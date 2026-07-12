const { Prisma } = require('@prisma/client');

/**
 * Global error handler middleware.
 * Catches all errors forwarded via next(err) and returns structured JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const field = err.meta?.target?.join(', ') || 'field';
        return res.status(409).json({
          error: `A record with this ${field} already exists.`,
        });
      }
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found.',
        });
      case 'P2003':
        return res.status(400).json({
          error: 'Related record not found. Check foreign key references.',
        });
      default:
        return res.status(400).json({
          error: 'A database error occurred. Please try again.',
        });
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Invalid data provided. Please check your input.',
    });
  }

  // Custom application errors (thrown with statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token has expired.' });
  }

  // Fallback: 500 Internal Server Error
  return res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error.',
  });
};

module.exports = errorHandler;
