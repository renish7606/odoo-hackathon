const { Router } = require('express');
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicle.controller');
const { protect, permit } = require('../middleware/auth');
const { validateVehicle, validateVehicleUpdate, validateIdParam } = require('../middleware/validate');

const router = Router();

// All vehicle routes require authentication
router.use(protect);

// GET — accessible to FleetManager and FinancialAnalyst (for reporting)
router.get('/', permit('FleetManager', 'FinancialAnalyst'), getVehicles);
router.get('/:id', validateIdParam, permit('FleetManager', 'FinancialAnalyst'), getVehicleById);

// CUD — FleetManager only
router.post('/', permit('FleetManager'), validateVehicle, createVehicle);
router.patch('/:id', validateIdParam, permit('FleetManager'), validateVehicleUpdate, updateVehicle);
router.delete('/:id', validateIdParam, permit('FleetManager'), deleteVehicle);

module.exports = router;
