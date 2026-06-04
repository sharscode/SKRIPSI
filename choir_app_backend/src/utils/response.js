/**
 * Standardized API Response Helpers
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {*} data
 * @param {number} statusCode
 */
function sendSuccess(res, message, data = null, statusCode = 200) {
  const response = { success: true, message };
  if (data !== null && data !== undefined) response.data = data;
  return res.status(statusCode).json(response);
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {Array} errors - Optional validation errors array
 */
function sendError(res, message, statusCode = 500, errors = null) {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

module.exports = { sendSuccess, sendError };
