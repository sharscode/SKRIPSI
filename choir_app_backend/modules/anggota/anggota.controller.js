const { getPool } = require('../../config/db');
const bcrypt = require('bcrypt');


// 🔹 GET ALL + pagination + search
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;

    const pool = await getPool();

    const result = await pool.request()
      .input('offset', parseInt(offset))
      .input('limit', parseInt(limit))
      .input('search', search)
      .query(`
        SELECT id, nrp, nama_lengkap, bagian_suara, alamat, kontak, email, created_at
        FROM anggota
        WHERE nama_lengkap LIKE '%' + @search + '%'
        ORDER BY id DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
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
      .query(`SELECT id, nrp, nama_lengkap, bagian_suara, alamat, kontak, email FROM anggota WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan',
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
    const {
      nrp,
      nama_lengkap,
      bagian_suara,
      alamat,
      kontak,
      email,
      password,
    } = req.body;

    // validasi basic
    if (!nrp || !nama_lengkap || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Data wajib belum lengkap',
      });
    }

    const pool = await getPool();

    // cek email duplicate
    const check = await pool.request()
      .input('email', email)
      .query(`SELECT id FROM anggota WHERE email = @email`);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('nrp', nrp)
      .input('nama_lengkap', nama_lengkap)
      .input('bagian_suara', bagian_suara)
      .input('alamat', alamat)
      .input('kontak', kontak)
      .input('email', email)
      .input('password', hashedPassword)
      .query(`
        INSERT INTO anggota
        (nrp, nama_lengkap, bagian_suara, alamat, kontak, email, password, created_at)
        VALUES
        (@nrp, @nama_lengkap, @bagian_suara, @alamat, @kontak, @email, @password, GETDATE())
      `);

    res.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
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

    const {
      nrp,
      nama_lengkap,
      bagian_suara,
      alamat,
      kontak,
      email,
    } = req.body;

    const pool = await getPool();

    await pool.request()
      .input('id', id)
      .input('nrp', nrp)
      .input('nama_lengkap', nama_lengkap)
      .input('bagian_suara', bagian_suara)
      .input('alamat', alamat)
      .input('kontak', kontak)
      .input('email', email)
      .query(`
        UPDATE anggota SET
          nrp = @nrp,
          nama_lengkap = @nama_lengkap,
          bagian_suara = @bagian_suara,
          alamat = @alamat,
          kontak = @kontak,
          email = @email,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Anggota berhasil diupdate',
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
      .query(`DELETE FROM anggota WHERE id = @id`);

    res.json({
      success: true,
      message: 'Anggota berhasil dihapus',
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