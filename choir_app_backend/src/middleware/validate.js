/**
 * Express-Validator Runner Middleware
 * Checks validation results and returns 400 with formatted errors if invalid.
 */
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Run validation and return errors if any.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return sendError(res, 'Data input tidak valid.', 400, formattedErrors);
  }

  next();
}

module.exports = validate;
