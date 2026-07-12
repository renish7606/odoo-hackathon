const { Router } = require('express');
const { getFuelLogs, createFuelLog } = require('../controllers/fuel.controller');
const { protect, permit } = require('../middleware/auth');
const { validateFuelLog } = require('../middleware/validate');

const router = Router();

router.use(protect);

router.get('/', permit('FleetManager', 'Driver', 'FinancialAnalyst'), getFuelLogs);
router.post('/', permit('FleetManager', 'Driver', 'FinancialAnalyst'), validateFuelLog, createFuelLog);

module.exports = router;
