const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

/**
 * GET /api/drivers
 */
const getDrivers = asyncHandler(async (req, res) => {
  const drivers = await prisma.driver.findMany({
    orderBy: { created_at: 'desc' },
  });
  res.json(drivers);
});

/**
 * GET /api/drivers/:id
 */
const getDriverById = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: {
      trips: { take: 10, orderBy: { created_at: 'desc' } },
    },
  });

  if (!driver) {
    return res.status(404).json({ error: 'Driver not found.' });
  }

  res.json(driver);
});

/**
 * POST /api/drivers
 */
const createDriver = asyncHandler(async (req, res) => {
  const {
    name,
    license_number,
    license_category,
    license_expiry_date,
    contact_number,
    safety_score,
    status,
  } = req.body;

  const driver = await prisma.driver.create({
    data: {
      name,
      license_number,
      license_category,
      license_expiry_date: new Date(license_expiry_date),
      contact_number,
      safety_score: parseFloat(safety_score || 100),
      status: status || 'Available',
    },
  });

  await prisma.activity.create({
    data: { text: `Driver added: ${name} (${license_category})` },
  });

  res.status(201).json(driver);
});

/**
 * PATCH /api/drivers/:id
 */
const updateDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.driver.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Driver not found.' });
  }

  const updateData = {};
  const allowedFields = [
    'name', 'license_number', 'license_category',
    'license_expiry_date', 'contact_number', 'safety_score', 'status',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (field === 'license_expiry_date') {
        updateData[field] = new Date(req.body[field]);
      } else if (field === 'safety_score') {
        updateData[field] = parseFloat(req.body[field]);
      } else {
        updateData[field] = req.body[field];
      }
    }
  }

  const driver = await prisma.driver.update({
    where: { id },
    data: updateData,
  });

  res.json(driver);
});

/**
 * DELETE /api/drivers/:id
 */
const deleteDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.driver.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Driver not found.' });
  }

  if (existing.status === 'OnTrip') {
    return res.status(400).json({
      error: 'Cannot delete a driver who is currently on a trip.',
    });
  }

  await prisma.driver.delete({ where: { id } });

  await prisma.activity.create({
    data: { text: `Driver removed: ${existing.name}` },
  });

  res.json({ message: 'Driver deleted successfully.' });
});

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};
