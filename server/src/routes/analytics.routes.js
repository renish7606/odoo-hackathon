const { Router } = require('express');
const { getDashboard, getReport } = require('../controllers/analytics.controller');
const { protect, permit } = require('../middleware/auth');

const router = Router();

router.use(protect);

router.get('/dashboard', permit('FleetManager', 'FinancialAnalyst'), getDashboard);
router.get('/report', permit('FleetManager', 'FinancialAnalyst'), getReport);

module.exports = router;
