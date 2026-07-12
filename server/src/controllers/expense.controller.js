const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../utils/asyncHandler');

const prisma = new PrismaClient();

/**
 * GET /api/expenses
 */
const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await prisma.expense.findMany({
    include: {
      vehicle: {
        select: { id: true, registration_number: true, name_model: true },
      },
    },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

/**
 * POST /api/expenses
 */
const createExpense = asyncHandler(async (req, res) => {
  const { vehicle_id, type, cost, date } = req.body;

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }

  const expense = await prisma.expense.create({
    data: {
      vehicle_id,
      type,
      cost: parseFloat(cost),
      date: date ? new Date(date) : new Date(),
    },
    include: {
      vehicle: {
        select: { id: true, registration_number: true, name_model: true },
      },
    },
  });

  await prisma.activity.create({
    data: { text: `Expense logged: ${type} — ₹${cost} for ${vehicle.name_model}` },
  });

  res.status(201).json(expense);
});

module.exports = { getExpenses, createExpense };
