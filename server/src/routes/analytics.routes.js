const { Router } = require('express');
const { getDashboard, getReport, triggerCron } = require('../controllers/analytics.controller');
const { protect, permit } = require('../middleware/auth');

const router = Router();

// All analytics routes require authentication
router.use(protect);

// Dashboard & reports — accessible to FleetManager and FinancialAnalyst
router.get('/dashboard', permit('FleetManager', 'FinancialAnalyst'), getDashboard);
router.get('/report', permit('FleetManager', 'FinancialAnalyst'), getReport);

// Cron trigger — FleetManager only (destructive: suspends drivers)
router.post('/trigger-cron', permit('FleetManager'), triggerCron);

module.exports = router;
