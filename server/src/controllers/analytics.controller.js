const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/analytics/dashboard
 * Returns computed KPIs and per-vehicle analytics.
 */
const getDashboard = asyncHandler(async (req, res) => {
  // ─── Summary Counts ─────────────────────────────────────────
  const [totalVehicles, activeTrips, availableDrivers] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: 'Retired' } } }),
    prisma.trip.count({ where: { status: 'Dispatched' } }),
    prisma.driver.count({ where: { status: 'Available' } }),
  ]);

  // ─── Fleet Utilization ──────────────────────────────────────
  const onTripVehicles = await prisma.vehicle.count({ where: { status: 'OnTrip' } });
  const fleetUtilization = totalVehicles > 0
    ? parseFloat(((onTripVehicles / totalVehicles) * 100).toFixed(2))
    : 0;

  // ─── Per-Vehicle Analytics ──────────────────────────────────
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'Retired' } },
    select: {
      id: true,
      registration_number: true,
      name_model: true,
      acquisition_cost: true,
    },
  });

  const vehicleCosts = [];
  const fuelEfficiency = [];
  const vehicleROI = [];

  for (const v of vehicles) {
    // Aggregate fuel costs
    const fuelAgg = await prisma.fuelLog.aggregate({
      where: { vehicle_id: v.id },
      _sum: { cost: true, liters: true },
    });
    const fuelCost = fuelAgg._sum.cost || 0;
    const totalFuel = fuelAgg._sum.liters || 0;

    // Aggregate maintenance costs
    const maintAgg = await prisma.maintenanceLog.aggregate({
      where: { vehicle_id: v.id },
      _sum: { cost: true },
    });
    const maintenanceCost = maintAgg._sum.cost || 0;

    // Aggregate general expenses
    const expenseAgg = await prisma.expense.aggregate({
      where: { vehicle_id: v.id },
      _sum: { cost: true },
    });
    const expenseCost = expenseAgg._sum.cost || 0;

    // Total operational cost = fuel + maintenance + expenses
    const totalCost = fuelCost + maintenanceCost + expenseCost;

    vehicleCosts.push({
      vehicle_id: v.id,
      registration_number: v.registration_number,
      name_model: v.name_model,
      totalCost: parseFloat(totalCost.toFixed(2)),
      fuelCost: parseFloat(fuelCost.toFixed(2)),
      maintenanceCost: parseFloat(maintenanceCost.toFixed(2)),
      expenseCost: parseFloat(expenseCost.toFixed(2)),
    });

    // Aggregate distance and revenue from completed trips
    const tripAgg = await prisma.trip.aggregate({
      where: { vehicle_id: v.id, status: 'Completed' },
      _sum: { planned_distance: true, revenue: true },
    });
    const totalDistance = tripAgg._sum.planned_distance || 0;
    const totalRevenue = tripAgg._sum.revenue || 0;

    // Fuel Efficiency = Total Planned Distance / Total Fuel Consumed
    const efficiency = totalFuel > 0
      ? parseFloat((totalDistance / totalFuel).toFixed(2))
      : 0;

    fuelEfficiency.push({
      vehicle_id: v.id,
      registration_number: v.registration_number,
      name_model: v.name_model,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalFuel: parseFloat(totalFuel.toFixed(2)),
      efficiency,
    });

    // Vehicle ROI = (Revenue - Total Costs) / Acquisition Cost
    const roi = v.acquisition_cost > 0
      ? parseFloat(((totalRevenue - totalCost) / v.acquisition_cost).toFixed(4))
      : 0;

    vehicleROI.push({
      vehicle_id: v.id,
      registration_number: v.registration_number,
      name_model: v.name_model,
      revenue: parseFloat(totalRevenue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      acquisitionCost: parseFloat(v.acquisition_cost.toFixed(2)),
      roi,
    });
  }

  // ─── Recent Activity ────────────────────────────────────────
  const activity = await prisma.activity.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  res.json({
    totalVehicles,
    activeTrips,
    availableDrivers,
    fleetUtilization,
    vehicleCosts,
    fuelEfficiency,
    vehicleROI,
    activity,
  });
});

/**
 * GET /api/analytics/report
 * Returns structured JSON for CSV export — flat per-vehicle metrics.
 */
const getReport = asyncHandler(async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      registration_number: true,
      name_model: true,
      acquisition_cost: true,
    },
  });

  const data = [];

  for (const v of vehicles) {
    const fuelAgg = await prisma.fuelLog.aggregate({
      where: { vehicle_id: v.id },
      _sum: { cost: true, liters: true },
    });
    const totalFuelCost = fuelAgg._sum.cost || 0;
    const totalFuel = fuelAgg._sum.liters || 0;

    const maintAgg = await prisma.maintenanceLog.aggregate({
      where: { vehicle_id: v.id },
      _sum: { cost: true },
    });
    const totalMaintenanceCost = maintAgg._sum.cost || 0;

    const expenseAgg = await prisma.expense.aggregate({
      where: { vehicle_id: v.id },
      _sum: { cost: true },
    });
    const totalExpenses = expenseAgg._sum.cost || 0;

    const tripAgg = await prisma.trip.aggregate({
      where: { vehicle_id: v.id, status: 'Completed' },
      _sum: { planned_distance: true, revenue: true },
    });
    const totalDistance = tripAgg._sum.planned_distance || 0;
    const totalRevenue = tripAgg._sum.revenue || 0;

    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;
    const fuelEff = totalFuel > 0
      ? parseFloat((totalDistance / totalFuel).toFixed(2))
      : 0;
    const roi = v.acquisition_cost > 0
      ? parseFloat(((totalRevenue - totalOperationalCost) / v.acquisition_cost).toFixed(4))
      : 0;

    data.push({
      vehicle_id: v.id,
      registration_number: v.registration_number,
      name_model: v.name_model,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
      totalMaintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      totalOperationalCost: parseFloat(totalOperationalCost.toFixed(2)),
      fuelEfficiency: fuelEff,
      roi,
    });
  }

  res.json({
    generatedAt: new Date().toISOString(),
    data,
  });
});

/**
 * POST /api/analytics/trigger-cron
 * Simulates a cron job to suspend drivers with expired licenses.
 */
const triggerCron = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find drivers with expired licenses who are not already suspended
  const expiredDrivers = await prisma.driver.findMany({
    where: {
      license_expiry_date: {
        lt: today,
      },
      status: {
        not: 'Suspended'
      }
    }
  });

  if (expiredDrivers.length === 0) {
    return res.json({ message: 'No drivers with newly expired licenses found.', count: 0 });
  }

  // Suspend them
  const updateResult = await prisma.driver.updateMany({
    where: {
      id: {
        in: expiredDrivers.map(d => d.id)
      }
    },
    data: {
      status: 'Suspended'
    }
  });

  // Log activity for each
  for (const driver of expiredDrivers) {
    await prisma.activity.create({
      data: {
        text: `SYSTEM (CRON): Driver ${driver.name} suspended due to expired license (${driver.license_expiry_date.toISOString().split('T')[0]}).`
      }
    });
  }

  res.json({ 
    message: `Successfully suspended ${updateResult.count} driver(s).`,
    count: updateResult.count
  });
});

module.exports = { getDashboard, getReport, triggerCron };
