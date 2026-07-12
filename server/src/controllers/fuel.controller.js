const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/fuel-logs
 */
const getFuelLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.fuelLog.findMany({
    include: {
      vehicle: {
        select: { id: true, registration_number: true, name_model: true },
      },
      trip: {
        select: { id: true, source: true, destination: true },
      },
    },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

/**
 * POST /api/fuel-logs
 * Wrapped in $transaction for atomicity with activity log (W-04).
 */
const createFuelLog = asyncHandler(async (req, res) => {
  const { vehicle_id, trip_id, liters, cost, date } = req.body;

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  // Verify trip exists if provided
  if (trip_id) {
    const trip = await prisma.trip.findUnique({ where: { id: trip_id } });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
  }

  const log = await prisma.$transaction(async (tx) => {
    const l = await tx.fuelLog.create({
      data: {
        vehicle_id,
        trip_id: trip_id || null,
        liters: parseFloat(liters),
        cost: parseFloat(cost),
        date: date ? new Date(date) : new Date(),
      },
      include: {
        vehicle: {
          select: { id: true, registration_number: true, name_model: true },
        },
      },
    });

    await tx.activity.create({
      data: { text: `Fuel log added: ${liters}L for ${vehicle.name_model}` },
    });

    return l;
  });

  res.status(201).json(log);
});

module.exports = { getFuelLogs, createFuelLog };
