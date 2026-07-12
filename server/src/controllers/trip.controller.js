const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

/**
 * GET /api/trips
 */
const getTrips = asyncHandler(async (req, res) => {
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: {
        select: { id: true, registration_number: true, name_model: true, status: true },
      },
      driver: {
        select: { id: true, name: true, license_category: true, status: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });
  res.json(trips);
});

/**
 * GET /api/trips/:id
 */
const getTripById = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: true,
      driver: true,
      fuel_logs: true,
    },
  });

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  res.json(trip);
});

/**
 * Validates dispatch guardrails for assigning a vehicle and driver to a trip.
 * Returns an error message string if validation fails, or null if all checks pass.
 */
async function validateDispatchGuardrails(vehicleId, driverId, cargoWeight) {
  // Fetch vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return 'Vehicle not found.';

  // Fetch driver
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) return 'Driver not found.';

  // Rule 1: Vehicle cannot be Retired or InShop
  if (vehicle.status === 'Retired') {
    return `Vehicle '${vehicle.registration_number}' is retired and cannot be assigned to a trip.`;
  }
  if (vehicle.status === 'InShop') {
    return `Vehicle '${vehicle.registration_number}' is currently in the shop for maintenance.`;
  }

  // Rule 2: Driver license must not be expired
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(driver.license_expiry_date) < today) {
    return `Driver '${driver.name}' has an expired license (expired ${driver.license_expiry_date.toISOString().split('T')[0]}).`;
  }

  // Rule 3: Driver must not be Suspended
  if (driver.status === 'Suspended') {
    return `Driver '${driver.name}' is suspended and cannot be assigned to a trip.`;
  }

  // Rule 4: Vehicle must not already be OnTrip
  if (vehicle.status === 'OnTrip') {
    return `Vehicle '${vehicle.registration_number}' is already on another active trip.`;
  }

  // Rule 5: Driver must not already be OnTrip
  if (driver.status === 'OnTrip') {
    return `Driver '${driver.name}' is already on another active trip.`;
  }

  // Rule 6: Cargo weight must not exceed max load capacity
  if (cargoWeight > vehicle.max_load_capacity) {
    return `Cargo weight (${cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.max_load_capacity} kg).`;
  }

  return null; // All checks passed
}

/**
 * POST /api/trips
 * Creates a new trip. If status is 'Dispatched', triggers dispatch guardrails and state cascades.
 */
const createTrip = asyncHandler(async (req, res) => {
  const {
    source,
    destination,
    vehicle_id,
    driver_id,
    cargo_weight,
    planned_distance,
    status,
  } = req.body;

  const tripStatus = status || 'Draft';

  // If dispatching immediately, run all guardrails
  if (tripStatus === 'Dispatched') {
    const error = await validateDispatchGuardrails(
      vehicle_id,
      driver_id,
      parseFloat(cargo_weight)
    );
    if (error) {
      return res.status(400).json({ error });
    }
  }

  // Create trip + cascade in an atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        source,
        destination,
        vehicle_id,
        driver_id,
        cargo_weight: parseFloat(cargo_weight),
        planned_distance: parseFloat(planned_distance),
        status: tripStatus,
      },
      include: {
        vehicle: {
          select: { id: true, registration_number: true, name_model: true, status: true },
        },
        driver: {
          select: { id: true, name: true, license_category: true, status: true },
        },
      },
    });

    // Automated state cascade: Dispatched → set vehicle/driver to OnTrip
    if (tripStatus === 'Dispatched') {
      await tx.vehicle.update({
        where: { id: vehicle_id },
        data: { status: 'OnTrip' },
      });
      await tx.driver.update({
        where: { id: driver_id },
        data: { status: 'OnTrip' },
      });
    }

    await tx.activity.create({
      data: {
        text: `Trip created: ${source} → ${destination} [${tripStatus}]`,
      },
    });

    return trip;
  });

  res.status(201).json(result);
});

/**
 * PATCH /api/trips/:id
 * Updates a trip. Handles status transitions with automated state cascades.
 */
const updateTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Fetch existing trip with relations
  const existing = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  const newStatus = req.body.status;
  const oldStatus = existing.status;

  // If transitioning to Dispatched, run dispatch guardrails
  if (newStatus === 'Dispatched' && oldStatus !== 'Dispatched') {
    const error = await validateDispatchGuardrails(
      existing.vehicle_id,
      existing.driver_id,
      existing.cargo_weight
    );
    if (error) {
      return res.status(400).json({ error });
    }
  }

  // Build update data
  const updateData = {};
  if (newStatus) updateData.status = newStatus;
  if (req.body.final_odometer !== undefined) {
    updateData.final_odometer = parseFloat(req.body.final_odometer);
  }
  if (req.body.fuel_consumed_liters !== undefined) {
    updateData.fuel_consumed_liters = parseFloat(req.body.fuel_consumed_liters);
  }
  if (req.body.revenue !== undefined) {
    updateData.revenue = parseFloat(req.body.revenue);
  }

  // Execute in a transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: {
          select: { id: true, registration_number: true, name_model: true, status: true },
        },
        driver: {
          select: { id: true, name: true, license_category: true, status: true },
        },
      },
    });

    // ── Automated State Cascades ──
    if (newStatus && newStatus !== oldStatus) {
      // Draft → Dispatched: vehicle & driver → OnTrip
      if (newStatus === 'Dispatched') {
        await tx.vehicle.update({
          where: { id: existing.vehicle_id },
          data: { status: 'OnTrip' },
        });
        await tx.driver.update({
          where: { id: existing.driver_id },
          data: { status: 'OnTrip' },
        });
      }

      // Dispatched → Completed: vehicle & driver → Available, update odometer
      if (newStatus === 'Completed') {
        const vehicleUpdate = { status: 'Available' };
        if (updateData.final_odometer) {
          vehicleUpdate.current_odometer = updateData.final_odometer;
        }
        await tx.vehicle.update({
          where: { id: existing.vehicle_id },
          data: vehicleUpdate,
        });
        await tx.driver.update({
          where: { id: existing.driver_id },
          data: { status: 'Available' },
        });
      }

      // Any → Cancelled: vehicle & driver → Available (only if they were OnTrip)
      if (newStatus === 'Cancelled') {
        if (existing.vehicle.status === 'OnTrip') {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'Available' },
          });
        }
        if (existing.driver.status === 'OnTrip') {
          await tx.driver.update({
            where: { id: existing.driver_id },
            data: { status: 'Available' },
          });
        }
      }

      await tx.activity.create({
        data: {
          text: `Trip ${existing.source} → ${existing.destination} status: ${oldStatus} → ${newStatus}`,
        },
      });
    }

    return trip;
  });

  res.json(result);
});

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
};
