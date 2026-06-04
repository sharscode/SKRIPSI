const { getPool } = require('../../config/db');
const QRCode = require('qrcode');
const crypto = require('crypto');


// 🔹 GET ALL (filter tipe & acara)
const getAll = async (req, res) => {
  try {
    const { tipe, acara_id } = req.query;

    const pool = await getPool();

    const result = await pool.request()
      .input('tipe', tipe || null)
      .input('acara_id', acara_id || null)
      .query(`
        SELECT 
          l.id,
          l.tanggal,
          l.jam,
          l.lokasi,
          l.keterangan,
          l.tipe_latihan,
          l.waktu_notifikasi,
          l.acara_id,
          a.nama_acara
        FROM latihan l
        LEFT JOIN acara a ON l.acara_id = a.id
        WHERE 
          (@tipe IS NULL OR l.tipe_latihan = @tipe)
          AND (@acara_id IS NULL OR l.acara_id = @acara_id)
        ORDER BY l.tanggal ASC
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


// 🔹 GET BY ACARA (HANYA SEKALI)
const getByAcara = async (req, res) => {
  try {
    const { acara_id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('acara_id', acara_id)
      .query(`
        SELECT 
          l.*,
          a.nama_acara
        FROM latihan l
        LEFT JOIN acara a ON l.acara_id = a.id
        WHERE l.acara_id = @acara_id
          AND l.tipe_latihan = 'sekali'
        ORDER BY l.tanggal ASC
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
          l.*,
          a.nama_acara
        FROM latihan l
        LEFT JOIN acara a ON l.acara_id = a.id
        WHERE l.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Latihan tidak ditemukan',
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


// 🔹 CREATE (VALIDASI TIPE FIX)
const create = async (req, res) => {
  try {
    const {
      tanggal,
      jam,
      lokasi,
      keterangan,
      tipe_latihan,
      waktu_notifikasi,
      acara_id
    } = req.body;

    if (!tanggal || !jam || !lokasi || !tipe_latihan) {
      return res.status(400).json({
        success: false,
        message: 'Data wajib belum lengkap',
      });
    }

    // 🔥 VALIDASI TIPE (INI PENTING)
    if (tipe_latihan === 'sekali' && !acara_id) {
      return res.status(400).json({
        success: false,
        message: 'Latihan sekali wajib punya acara',
      });
    }

    if (tipe_latihan === 'rutin' && acara_id) {
      return res.status(400).json({
        success: false,
        message: 'Latihan rutin tidak boleh punya acara',
      });
    }

    const pool = await getPool();

    await pool.request()
      .input('tanggal', tanggal)
      .input('jam', jam)
      .input('lokasi', lokasi)
      .input('keterangan', keterangan)
      .input('tipe_latihan', tipe_latihan)
      .input('waktu_notifikasi', waktu_notifikasi || 60)
      .input('created_by', req.user.id)
      .input('acara_id', acara_id || null)
      .query(`
        INSERT INTO latihan
        (tanggal, jam, lokasi, keterangan, tipe_latihan, waktu_notifikasi, created_by, acara_id)
        VALUES
        (@tanggal, @jam, @lokasi, @keterangan, @tipe_latihan, @waktu_notifikasi, @created_by, @acara_id)
      `);

    res.json({
      success: true,
      message: 'Latihan berhasil dibuat',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 UPDATE (TAMBAH VALIDASI)
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      tanggal,
      jam,
      lokasi,
      keterangan,
      tipe_latihan,
      waktu_notifikasi,
      acara_id
    } = req.body;

    // 🔥 VALIDASI ULANG
    if (tipe_latihan === 'sekali' && !acara_id) {
      return res.status(400).json({
        success: false,
        message: 'Latihan sekali wajib punya acara',
      });
    }

    if (tipe_latihan === 'rutin' && acara_id) {
      return res.status(400).json({
        success: false,
        message: 'Latihan rutin tidak boleh punya acara',
      });
    }

    const pool = await getPool();

    await pool.request()
      .input('id', id)
      .input('tanggal', tanggal)
      .input('jam', jam)
      .input('lokasi', lokasi)
      .input('keterangan', keterangan)
      .input('tipe_latihan', tipe_latihan)
      .input('waktu_notifikasi', waktu_notifikasi)
      .input('acara_id', acara_id || null)
      .query(`
        UPDATE latihan SET
          tanggal = @tanggal,
          jam = @jam,
          lokasi = @lokasi,
          keterangan = @keterangan,
          tipe_latihan = @tipe_latihan,
          waktu_notifikasi = @waktu_notifikasi,
          acara_id = @acara_id
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Latihan berhasil diupdate',
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
      .query(`DELETE FROM latihan WHERE id = @id`);

    res.json({
      success: true,
      message: 'Latihan berhasil dihapus',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔥 GENERATE QR (UNCHANGED)
const generateQR = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // cek latihan
    const check = await pool.request()
      .input('id', id)
      .query(`SELECT id FROM latihan WHERE id = @id`);

    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Latihan tidak ditemukan',
      });
    }

    // token random (AMAN)
    const token = crypto.randomBytes(16).toString('hex');

    // expired 15 detik
    const expired = new Date(Date.now() + 15000);

    await pool.request()
      .input('id', id)
      .input('qr_token', token)
      .input('qr_expired_at', expired)
      .query(`
        UPDATE latihan
        SET qr_token = @qr_token,
            qr_expired_at = @qr_expired_at
        WHERE id = @id
      `);

    // generate QR image (High Resolution)
    const qr = await QRCode.toDataURL(token, {
      width: 800,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      token,
      expired,
      qr,
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
  getByAcara,
  getById,
  create,
  update,
  remove,
  generateQR,
};