const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

/**
 * GET /api/maintenance
 */
const getMaintenanceLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.maintenanceLog.findMany({
    include: {
      vehicle: {
        select: { id: true, registration_number: true, name_model: true },
      },
    },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

/**
 * GET /api/maintenance/:id
 */
const getMaintenanceLogById = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });

  if (!log) {
    return res.status(404).json({ error: 'Maintenance log not found.' });
  }

  res.json(log);
});

/**
 * POST /api/maintenance
 * Creates a maintenance log. If status is 'Open', forces the vehicle to 'InShop'.
 */
const createMaintenanceLog = asyncHandler(async (req, res) => {
  const { vehicle_id, issue_description, priority, cost, status, date } = req.body;

  const maintStatus = status || 'Open';

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        vehicle_id,
        issue_description,
        priority: priority || 'Medium',
        cost: parseFloat(cost || 0),
        status: maintStatus,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        vehicle: {
          select: { id: true, registration_number: true, name_model: true },
        },
      },
    });

    // State cascade: Open maintenance → vehicle goes to InShop
    if (maintStatus === 'Open') {
      await tx.vehicle.update({
        where: { id: vehicle_id },
        data: { status: 'InShop' },
      });
    }

    await tx.activity.create({
      data: {
        text: `Maintenance log created for ${vehicle.name_model}: ${issue_description} [${maintStatus}]`,
      },
    });

    return log;
  });

  res.status(201).json(result);
});

/**
 * PATCH /api/maintenance/:id
 * Updates a maintenance log. Handles status cascades for Open/Closed transitions.
 */
const updateMaintenanceLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Maintenance log not found.' });
  }

  const newStatus = req.body.status;
  const oldStatus = existing.status;

  const updateData = {};
  if (req.body.issue_description) updateData.issue_description = req.body.issue_description;
  if (req.body.priority) updateData.priority = req.body.priority;
  if (req.body.cost !== undefined) updateData.cost = parseFloat(req.body.cost);
  if (newStatus) updateData.status = newStatus;

  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: {
          select: { id: true, registration_number: true, name_model: true },
        },
      },
    });

    // State cascades on status change
    if (newStatus && newStatus !== oldStatus) {
      if (newStatus === 'Open') {
        // Re-opening → vehicle back to InShop
        await tx.vehicle.update({
          where: { id: existing.vehicle_id },
          data: { status: 'InShop' },
        });
      }

      if (newStatus === 'Closed') {
        // Closing → restore vehicle to Available (unless Retired, or other open logs exist)
        const vehicle = await tx.vehicle.findUnique({
          where: { id: existing.vehicle_id },
        });

        // Check if there are other open maintenance logs for this vehicle
        const otherOpenLogs = await tx.maintenanceLog.count({
          where: {
            vehicle_id: existing.vehicle_id,
            status: 'Open',
            id: { not: id },
          },
        });

        if (vehicle && vehicle.status !== 'Retired' && otherOpenLogs === 0) {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'Available' },
          });
        }
      }

      await tx.activity.create({
        data: {
          text: `Maintenance for ${existing.vehicle.name_model}: ${oldStatus} → ${newStatus}`,
        },
      });
    }

    return log;
  });

  res.json(result);
});

/**
 * PATCH /api/maintenance/:id/toggle
 * Toggles maintenance status between Open and Closed.
 */
const toggleMaintenanceLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Maintenance log not found.' });
  }

  const newStatus = existing.status === 'Open' ? 'Closed' : 'Open';

  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.update({
      where: { id },
      data: { status: newStatus },
      include: {
        vehicle: {
          select: { id: true, registration_number: true, name_model: true },
        },
      },
    });

    if (newStatus === 'Open') {
      await tx.vehicle.update({
        where: { id: existing.vehicle_id },
        data: { status: 'InShop' },
      });
    }

    if (newStatus === 'Closed') {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: existing.vehicle_id },
      });

      const otherOpenLogs = await tx.maintenanceLog.count({
        where: {
          vehicle_id: existing.vehicle_id,
          status: 'Open',
          id: { not: id },
        },
      });

      if (vehicle && vehicle.status !== 'Retired' && otherOpenLogs === 0) {
        await tx.vehicle.update({
          where: { id: existing.vehicle_id },
          data: { status: 'Available' },
        });
      }
    }

    await tx.activity.create({
      data: {
        text: `Maintenance for ${existing.vehicle.name_model} toggled: ${existing.status} → ${newStatus}`,
      },
    });

    return log;
  });

  res.json(result);
});

module.exports = {
  getMaintenanceLogs,
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
  toggleMaintenanceLog,
};
