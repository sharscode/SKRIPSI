const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // 1. pastikan user sudah login
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: user belum login',
        });
      }

      // 2. pastikan role ada
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: role tidak ditemukan',
        });
      }

      // 3. cek role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak',
          required_roles: allowedRoles,
          your_role: req.user.role,
        });
      }

      // 4. lolos
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada authorization',
      });
    }
  };
};

module.exports = { authorize };