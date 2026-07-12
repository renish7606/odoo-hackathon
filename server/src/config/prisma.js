const { PrismaClient } = require('@prisma/client');

/**
 * Shared PrismaClient singleton.
 * All modules should import from here instead of creating their own instance.
 */
const prisma = new PrismaClient();

module.exports = prisma;
