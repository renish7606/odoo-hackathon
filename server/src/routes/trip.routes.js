const { Router } = require('express');
const {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
} = require('../controllers/trip.controller');
const { protect, permit } = require('../middleware/auth');
const { validateTrip, validateTripUpdate, validateIdParam } = require('../middleware/validate');

const router = Router();

router.use(protect);

// GET — FleetManager and Driver
router.get('/', permit('FleetManager', 'Driver'), getTrips);
router.get('/:id', validateIdParam, permit('FleetManager', 'Driver'), getTripById);

// Create — FleetManager only
router.post('/', permit('FleetManager'), validateTrip, createTrip);

// Update (status transitions) — FleetManager and Driver
router.patch('/:id', validateIdParam, permit('FleetManager', 'Driver'), validateTripUpdate, updateTrip);

module.exports = router;
