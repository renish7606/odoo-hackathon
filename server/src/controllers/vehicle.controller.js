const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

/**
 * GET /api/vehicles
 */
const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { created_at: 'desc' },
  });
  res.json(vehicles);
});

/**
 * GET /api/vehicles/:id
 */
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      trips: { take: 10, orderBy: { created_at: 'desc' } },
      maintenance_logs: { take: 10, orderBy: { date: 'desc' } },
      fuel_logs: { take: 10, orderBy: { date: 'desc' } },
      expenses: { take: 10, orderBy: { date: 'desc' } },
    },
  });

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  res.json(vehicle);
});

/**
 * POST /api/vehicles
 */
const createVehicle = asyncHandler(async (req, res) => {
  const {
    registration_number,
    name_model,
    type,
    max_load_capacity,
    current_odometer,
    acquisition_cost,
    status,
    region,
  } = req.body;

  // Check uniqueness of registration number (case-insensitive)
  const existing = await prisma.vehicle.findFirst({
    where: {
      registration_number: {
        equals: registration_number,
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    return res.status(409).json({
      error: `Vehicle with registration number '${registration_number}' already exists.`,
    });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      registration_number,
      name_model,
      type,
      max_load_capacity: parseFloat(max_load_capacity),
      current_odometer: parseFloat(current_odometer || 0),
      acquisition_cost: parseFloat(acquisition_cost || 0),
      status: status || 'Available',
      region: region || '',
    },
  });

  // Log activity
  await prisma.activity.create({
    data: { text: `Vehicle added: ${name_model} (${registration_number})` },
  });

  res.status(201).json(vehicle);
});

/**
 * PATCH /api/vehicles/:id
 */
const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check existence
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  // If updating registration_number, check uniqueness
  if (req.body.registration_number) {
    const duplicate = await prisma.vehicle.findFirst({
      where: {
        registration_number: {
          equals: req.body.registration_number,
          mode: 'insensitive',
        },
        NOT: { id },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        error: `Vehicle with registration number '${req.body.registration_number}' already exists.`,
      });
    }
  }

  // Build update data — only include fields that were sent
  const updateData = {};
  const allowedFields = [
    'registration_number', 'name_model', 'type',
    'max_load_capacity', 'current_odometer', 'acquisition_cost',
    'status', 'region',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (['max_load_capacity', 'current_odometer', 'acquisition_cost'].includes(field)) {
        updateData[field] = parseFloat(req.body[field]);
      } else {
        updateData[field] = req.body[field];
      }
    }
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: updateData,
  });

  res.json(vehicle);
});

/**
 * DELETE /api/vehicles/:id
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  // Prevent deletion if vehicle is currently on a trip
  if (existing.status === 'OnTrip') {
    return res.status(400).json({
      error: 'Cannot delete a vehicle that is currently on a trip.',
    });
  }

  await prisma.vehicle.delete({ where: { id } });

  await prisma.activity.create({
    data: { text: `Vehicle removed: ${existing.name_model} (${existing.registration_number})` },
  });

  res.json({ message: 'Vehicle deleted successfully.' });
});

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
