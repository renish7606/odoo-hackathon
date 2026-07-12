const { Router } = require('express');
const { getExpenses, createExpense } = require('../controllers/expense.controller');
const { protect, permit } = require('../middleware/auth');
const { validateExpense } = require('../middleware/validate');

const router = Router();

router.use(protect);

router.get('/', permit('FleetManager', 'FinancialAnalyst'), getExpenses);
router.post('/', permit('FleetManager', 'FinancialAnalyst'), validateExpense, createExpense);

module.exports = router;
