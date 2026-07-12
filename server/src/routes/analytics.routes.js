const { Router } = require('express');
const { getDashboard, getReport, triggerCron } = require('../controllers/analytics.controller');

const router = Router();

// Public routes for hackathon simplicity (or apply auth if needed)
router.get('/dashboard', getDashboard);
router.get('/report', getReport);
router.post('/trigger-cron', triggerCron);

module.exports = router;
