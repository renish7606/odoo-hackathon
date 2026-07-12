const { Router } = require('express');
const {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driver.controller');
const { protect, permit } = require('../middleware/auth');
const { validateDriver, validateDriverUpdate, validateIdParam } = require('../middleware/validate');

const router = Router();

router.use(protect);

// GET — FleetManager and SafetyOfficer
router.get('/', permit('FleetManager', 'SafetyOfficer'), getDrivers);
router.get('/:id', validateIdParam, permit('FleetManager', 'SafetyOfficer'), getDriverById);

// Create/Delete — FleetManager only
router.post('/', permit('FleetManager'), validateDriver, createDriver);
router.delete('/:id', validateIdParam, permit('FleetManager'), deleteDriver);

// Update — FleetManager and SafetyOfficer (SafetyOfficer can update safety scores)
router.patch('/:id', validateIdParam, permit('FleetManager', 'SafetyOfficer'), validateDriverUpdate, updateDriver);

module.exports = router;
