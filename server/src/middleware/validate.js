const { body, param, validationResult } = require('express-validator');

/**
 * Runs validation and returns 400 with errors if validation fails.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ error: messages.join('; ') });
  }
  next();
};

// ─── Auth Validators ────────────────────────────────────────────
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.'),
  body('role')
    .isIn(['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'])
    .withMessage('Role must be one of: FleetManager, Driver, SafetyOfficer, FinancialAnalyst.'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  handleValidationErrors,
];

// ─── Vehicle Validators ─────────────────────────────────────────
const validateVehicle = [
  body('registration_number')
    .notEmpty()
    .withMessage('Registration number is required.')
    .trim(),
  body('name_model')
    .notEmpty()
    .withMessage('Vehicle model name is required.')
    .trim(),
  body('type')
    .notEmpty()
    .withMessage('Vehicle type is required.')
    .trim(),
  body('max_load_capacity')
    .isFloat({ min: 0 })
    .withMessage('Max load capacity must be a positive number.'),
  body('current_odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Odometer must be a positive number.'),
  body('acquisition_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost must be a positive number.'),
  body('status')
    .optional()
    .isIn(['Available', 'OnTrip', 'InShop', 'Retired'])
    .withMessage('Invalid vehicle status.'),
  body('region')
    .optional()
    .trim(),
  handleValidationErrors,
];

const validateVehicleUpdate = [
  body('registration_number')
    .optional()
    .notEmpty()
    .withMessage('Registration number cannot be empty.')
    .trim(),
  body('name_model')
    .optional()
    .notEmpty()
    .withMessage('Vehicle model name cannot be empty.')
    .trim(),
  body('type')
    .optional()
    .notEmpty()
    .withMessage('Vehicle type cannot be empty.')
    .trim(),
  body('max_load_capacity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max load capacity must be a positive number.'),
  body('current_odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Odometer must be a positive number.'),
  body('acquisition_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost must be a positive number.'),
  body('status')
    .optional()
    .isIn(['Available', 'OnTrip', 'InShop', 'Retired'])
    .withMessage('Invalid vehicle status.'),
  body('region')
    .optional()
    .trim(),
  handleValidationErrors,
];

// ─── Driver Validators ──────────────────────────────────────────
const validateDriver = [
  body('name')
    .notEmpty()
    .withMessage('Driver name is required.')
    .trim(),
  body('license_number')
    .notEmpty()
    .withMessage('License number is required.')
    .trim(),
  body('license_category')
    .notEmpty()
    .withMessage('License category is required.')
    .trim(),
  body('license_expiry_date')
    .isISO8601()
    .withMessage('License expiry date must be a valid ISO date.'),
  body('contact_number')
    .notEmpty()
    .withMessage('Contact number is required.')
    .trim(),
  body('safety_score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Safety score must be between 0 and 100.'),
  body('status')
    .optional()
    .isIn(['Available', 'OnTrip', 'OffDuty', 'Suspended'])
    .withMessage('Invalid driver status.'),
  handleValidationErrors,
];

const validateDriverUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Driver name cannot be empty.')
    .trim(),
  body('license_number')
    .optional()
    .notEmpty()
    .withMessage('License number cannot be empty.')
    .trim(),
  body('license_category')
    .optional()
    .notEmpty()
    .withMessage('License category cannot be empty.')
    .trim(),
  body('license_expiry_date')
    .optional()
    .isISO8601()
    .withMessage('License expiry date must be a valid ISO date.'),
  body('contact_number')
    .optional()
    .notEmpty()
    .withMessage('Contact number cannot be empty.')
    .trim(),
  body('safety_score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Safety score must be between 0 and 100.'),
  body('status')
    .optional()
    .isIn(['Available', 'OnTrip', 'OffDuty', 'Suspended'])
    .withMessage('Invalid driver status.'),
  handleValidationErrors,
];

// ─── Trip Validators ────────────────────────────────────────────
const validateTrip = [
  body('source')
    .notEmpty()
    .withMessage('Source is required.')
    .trim(),
  body('destination')
    .notEmpty()
    .withMessage('Destination is required.')
    .trim(),
  body('vehicle_id')
    .isUUID()
    .withMessage('Valid vehicle ID is required.'),
  body('driver_id')
    .isUUID()
    .withMessage('Valid driver ID is required.'),
  body('cargo_weight')
    .isFloat({ min: 0 })
    .withMessage('Cargo weight must be a positive number.'),
  body('planned_distance')
    .isFloat({ min: 0 })
    .withMessage('Planned distance must be a positive number.'),
  body('status')
    .optional()
    .isIn(['Draft', 'Dispatched', 'Completed', 'Cancelled'])
    .withMessage('Invalid trip status.'),
  handleValidationErrors,
];

const validateTripUpdate = [
  body('status')
    .optional()
    .isIn(['Draft', 'Dispatched', 'Completed', 'Cancelled'])
    .withMessage('Invalid trip status.'),
  body('final_odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Final odometer must be a positive number.'),
  body('fuel_consumed_liters')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fuel consumed must be a positive number.'),
  body('revenue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Revenue must be a positive number.'),
  handleValidationErrors,
];

// ─── Maintenance Validators ─────────────────────────────────────
const validateMaintenance = [
  body('vehicle_id')
    .isUUID()
    .withMessage('Valid vehicle ID is required.'),
  body('issue_description')
    .notEmpty()
    .withMessage('Issue description is required.')
    .trim(),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be Low, Medium, High, or Critical.'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number.'),
  body('status')
    .optional()
    .isIn(['Open', 'Closed'])
    .withMessage('Status must be Open or Closed.'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date.'),
  handleValidationErrors,
];

const validateMaintenanceUpdate = [
  body('issue_description')
    .optional()
    .notEmpty()
    .withMessage('Issue description cannot be empty.')
    .trim(),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be Low, Medium, High, or Critical.'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number.'),
  body('status')
    .optional()
    .isIn(['Open', 'Closed'])
    .withMessage('Status must be Open or Closed.'),
  handleValidationErrors,
];

// ─── Fuel Log Validators ────────────────────────────────────────
const validateFuelLog = [
  body('vehicle_id')
    .isUUID()
    .withMessage('Valid vehicle ID is required.'),
  body('trip_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Trip ID must be a valid UUID.'),
  body('liters')
    .isFloat({ min: 0 })
    .withMessage('Liters must be a positive number.'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number.'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date.'),
  handleValidationErrors,
];

// ─── Expense Validators ─────────────────────────────────────────
const validateExpense = [
  body('vehicle_id')
    .isUUID()
    .withMessage('Valid vehicle ID is required.'),
  body('type')
    .notEmpty()
    .withMessage('Expense type is required.')
    .trim(),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number.'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date.'),
  handleValidationErrors,
];

// ─── UUID param validator ───────────────────────────────────────
const validateIdParam = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID.'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateVehicle,
  validateVehicleUpdate,
  validateDriver,
  validateDriverUpdate,
  validateTrip,
  validateTripUpdate,
  validateMaintenance,
  validateMaintenanceUpdate,
  validateFuelLog,
  validateExpense,
  validateIdParam,
};
