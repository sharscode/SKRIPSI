const { getPool } = require('../../config/db');
const bcrypt = require('bcrypt');


// 🔹 GET ALL
const getAll = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT id, nama, email, role, created_at
      FROM admin
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 GET BY ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    const result = await pool.request()
      .input('id', id)
      .query(`
        SELECT id, nama, email, role, created_at
        FROM admin
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 CREATE
const create = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    // validasi
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Data wajib belum lengkap',
      });
    }

    const pool = await getPool();

    // cek email duplicate
    const check = await pool.request()
      .input('email', email)
      .query(`SELECT id FROM admin WHERE email = @email`);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('nama', nama)
      .input('email', email)
      .input('password', hashedPassword)
      .input('role', role || 'admin')
      .query(`
        INSERT INTO admin (nama, email, password, role, created_at)
        VALUES (@nama, @email, @password, @role, GETDATE())
      `);

    res.json({
      success: true,
      message: 'Admin berhasil dibuat',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 UPDATE
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, role } = req.body;

    const pool = await getPool();

    await pool.request()
      .input('id', id)
      .input('nama', nama)
      .input('email', email)
      .input('role', role)
      .query(`
        UPDATE admin SET
          nama = @nama,
          email = @email,
          role = @role
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Admin berhasil diupdate',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 DELETE
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getPool();

    await pool.request()
      .input('id', id)
      .query(`DELETE FROM admin WHERE id = @id`);

    res.json({
      success: true,
      message: 'Admin berhasil dihapus',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};