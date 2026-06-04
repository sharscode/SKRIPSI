const { getPool } = require('../../config/db');
const sql = require('mssql');


// 🔹 GET ALL (dengan jumlah latihan SEKALI)
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = null } = req.query;

    const pool = await getPool();

    const result = await pool.request()
      .input('status', sql.VarChar, status || null) // 🔥 FIX TYPE
      .query(`
        SELECT 
          a.id,
          a.nama_acara,
          a.tanggal,
          a.jenis_kegiatan,
          a.lokasi,
          a.penyelenggara,
          a.penanggung_jawab,
          a.jenis_skkk,
          a.status,
          COUNT(l.id) AS jumlah_latihan
        FROM acara a
        LEFT JOIN latihan l 
          ON l.acara_id = a.id 
          AND l.tipe_latihan = 'sekali' -- 🔥 PENTING
        WHERE (@status IS NULL OR a.status = @status)
        GROUP BY 
          a.id,
          a.nama_acara,
          a.tanggal,
          a.jenis_kegiatan,
          a.lokasi,
          a.penyelenggara,
          a.penanggung_jawab,
          a.jenis_skkk,
          a.status
        ORDER BY a.tanggal ASC
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


// 🔥 GET ACARA AKTIF (UNTUK LATIHAN PAGE)
const getAcaraAktif = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        a.id,
        a.nama_acara,
        a.tanggal,
        a.lokasi,
        a.status,
        COUNT(l.id) AS jumlah_latihan
      FROM acara a
      LEFT JOIN latihan l 
        ON l.acara_id = a.id 
        AND l.tipe_latihan = 'sekali' -- 🔥 WAJIB
      WHERE a.status = 'aktif'
      GROUP BY 
        a.id,
        a.nama_acara,
        a.tanggal,
        a.lokasi,
        a.status
      ORDER BY a.tanggal ASC
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
        SELECT 
          a.*,
          adm.nama AS created_by_nama
        FROM acara a
        LEFT JOIN admin adm ON a.created_by = adm.id
        WHERE a.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Acara tidak ditemukan',
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
      nama_acara,
      tanggal,
      jenis_kegiatan,
      lokasi,
      penyelenggara,
      penanggung_jawab,
      jenis_skkk,
      status,
    } = req.body;

    if (!nama_acara || !tanggal || !jenis_kegiatan) {
      return res.status(400).json({
        success: false,
        message: 'Data wajib belum lengkap',
      });
    }

    const pool = await getPool();

    await pool.request()
      .input('nama_acara', nama_acara)
      .input('tanggal', tanggal)
      .input('jenis_kegiatan', jenis_kegiatan)
      .input('lokasi', lokasi)
      .input('penyelenggara', penyelenggara)
      .input('penanggung_jawab', penanggung_jawab)
      .input('jenis_skkk', jenis_skkk)
      .input('status', sql.VarChar, status || 'aktif') // 🔥 FIX TYPE
      .input('created_by', req.user.id)
      .query(`
        INSERT INTO acara
        (nama_acara, tanggal, jenis_kegiatan, lokasi, penyelenggara,
         penanggung_jawab, jenis_skkk, status, created_at, created_by)
        VALUES
        (@nama_acara, @tanggal, @jenis_kegiatan, @lokasi, @penyelenggara,
         @penanggung_jawab, @jenis_skkk, @status, GETDATE(), @created_by)
      `);

    res.json({
      success: true,
      message: 'Acara berhasil dibuat',
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
      nama_acara,
      tanggal,
      jenis_kegiatan,
      lokasi,
      penyelenggara,
      penanggung_jawab,
      jenis_skkk,
      status,
    } = req.body;

    const pool = await getPool();

    await pool.request()
      .input('id', id)
      .input('nama_acara', nama_acara)
      .input('tanggal', tanggal)
      .input('jenis_kegiatan', jenis_kegiatan)
      .input('lokasi', lokasi)
      .input('penyelenggara', penyelenggara)
      .input('penanggung_jawab', penanggung_jawab)
      .input('jenis_skkk', jenis_skkk)
      .input('status', sql.VarChar, status) // 🔥 FIX TYPE
      .query(`
        UPDATE acara SET
          nama_acara = @nama_acara,
          tanggal = @tanggal,
          jenis_kegiatan = @jenis_kegiatan,
          lokasi = @lokasi,
          penyelenggara = @penyelenggara,
          penanggung_jawab = @penanggung_jawab,
          jenis_skkk = @jenis_skkk,
          status = @status
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Acara berhasil diupdate',
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
      .query(`DELETE FROM acara WHERE id = @id`);

    res.json({
      success: true,
      message: 'Acara berhasil dihapus',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['aktif', 'selesai', 'dibatalkan'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid',
      });
    }

    const pool = await getPool();

    await pool.request()
      .input('id', id)
      .input('status', sql.VarChar, status)
      .query(`
        UPDATE acara
        SET status = @status
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Status acara berhasil diupdate',
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
  getAcaraAktif,
  getById,
  create,
  update,
  updateStatus,
  remove,
};