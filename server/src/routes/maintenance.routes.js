const { Router } = require('express');
const {
  getMaintenanceLogs,
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
  toggleMaintenanceLog,
} = require('../controllers/maintenance.controller');
const { protect, permit } = require('../middleware/auth');
const { validateMaintenance, validateMaintenanceUpdate, validateIdParam } = require('../middleware/validate');

const router = Router();

router.use(protect);

// All maintenance routes — FleetManager only
router.get('/', permit('FleetManager'), getMaintenanceLogs);
router.get('/:id', validateIdParam, permit('FleetManager'), getMaintenanceLogById);
router.post('/', permit('FleetManager'), validateMaintenance, createMaintenanceLog);
router.patch('/:id', validateIdParam, permit('FleetManager'), validateMaintenanceUpdate, updateMaintenanceLog);
router.patch('/:id/toggle', validateIdParam, permit('FleetManager'), toggleMaintenanceLog);

module.exports = router;
