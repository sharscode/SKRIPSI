const jwt = require('jsonwebtoken');
const { loginAdmin, loginAnggota } = require('./auth.service');

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi',
    });
  }

  try {
    const user = await loginAdmin(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Hapus password dari response
    const { password: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Login berhasil',
      data: safeUser,
      token,
    });

  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

const loginMember = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi',
    });
  }

  try {
    const user = await loginAnggota(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: 'anggota', // Explicitly set role since DB might not have it or have different meaning
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Hapus password dari response
    const { password: _, ...safeUser } = user;
    safeUser.role = 'anggota';

    return res.json({
      success: true,
      message: 'Login anggota berhasil',
      data: safeUser,
      token,
    });

  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

module.exports = {
  login,
  loginMember,
};