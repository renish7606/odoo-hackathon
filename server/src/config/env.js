const dotenv = require('dotenv');
const path = require('path');

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: (() => {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start with an insecure default.');
    }
    return process.env.JWT_SECRET;
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
