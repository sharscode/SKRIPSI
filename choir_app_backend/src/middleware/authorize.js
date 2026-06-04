/**
 * Role-Based Authorization Middleware
 * Must be used AFTER auth middleware (requires req.user).
 */
const { sendError } = require('../utils/response');

/**
 * Authorize request based on user roles.
 * @param  {...string} roles - Allowed roles (e.g., 'super_admin', 'admin', 'anggota')
 * @returns {Function} Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Autentikasi diperlukan.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Anda tidak memiliki izin untuk mengakses resource ini.', 403);
    }

    next();
  };
}

module.exports = authorize;
