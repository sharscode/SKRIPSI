const { getPool } = require('../../config/db');

// ======================================
// GET LIST
// ======================================
const getAll = async (req, res) => {
  try {
    const {
      periode = '',
      status = '',
      search = '',
    } = req.query;

    const pool = await getPool();

    const result = await pool.request()
      .input('periode', periode)
      .input('status', status)
      .input('search', search)
      .query(`
        SELECT
          au.id,
          au.periode,
          au.status_keaktifan,
          au.tanggal_aktif,
          au.tanggal_nonaktif,

          a.id AS anggota_id,
          a.nrp,
          a.nama_lengkap,
          a.bagian_suara,
          a.kontak,
          a.email

        FROM anggota_ukm au
        JOIN anggota a
          ON au.anggota_id = a.id

        WHERE
          (@periode = '' OR au.periode = @periode)
          AND
          (@status = '' OR au.status_keaktifan = @status)
          AND
          (
            @search = ''
            OR a.nama_lengkap LIKE '%' + @search + '%'
            OR a.nrp LIKE '%' + @search + '%'
          )

        ORDER BY
          au.periode DESC,
          CASE au.status_keaktifan
            WHEN 'aktif' THEN 1
            ELSE 2
          END,

          CASE a.bagian_suara
            WHEN 'Sopran' THEN 1
            WHEN 'Alto' THEN 2
            WHEN 'Tenor' THEN 3
            WHEN 'Bass' THEN 4
            ELSE 99
          END,

          a.nama_lengkap ASC
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

// ======================================
// CREATE
// ======================================
const create = async (req, res) => {
  try {
    const {
      anggota_id,
      periode,
    } = req.body;

    if (!anggota_id || !periode) {
      return res.status(400).json({
        success: false,
        message: 'anggota_id dan periode wajib diisi',
      });
    }

    const pool = await getPool();

    const check = await pool.request()
      .input('anggota_id', anggota_id)
      .input('periode', periode)
      .query(`
        SELECT id
        FROM anggota_ukm
        WHERE anggota_id = @anggota_id
        AND periode = @periode
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Anggota sudah terdaftar di periode ini',
      });
    }

    await pool.request()
      .input('anggota_id', anggota_id)
      .input('periode', periode)
      .query(`
        INSERT INTO anggota_ukm (
          anggota_id,
          periode,
          status_keaktifan,
          tanggal_aktif
        )
        VALUES (
          @anggota_id,
          @periode,
          'aktif',
          GETDATE()
        )
      `);

    res.json({
      success: true,
      message: 'Anggota UKM berhasil ditambahkan',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================
// UPDATE STATUS
// ======================================
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_keaktifan } = req.body;

    if (!['aktif', 'nonaktif']
        .includes(status_keaktifan)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid',
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('id', id)
      .input(
        'status_keaktifan',
        status_keaktifan
      )
      .query(`
        UPDATE anggota_ukm
        SET
          status_keaktifan =
            @status_keaktifan,

          tanggal_nonaktif =
            CASE
              WHEN @status_keaktifan = 'nonaktif'
              THEN GETDATE()
              ELSE NULL
            END,

          updated_at = GETDATE()

        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    res.json({
      success: true,
      message: 'Status berhasil diupdate',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================
// HISTORY PER ANGGOTA
// ======================================
const getHistory = async (req, res) => {
  try {
    const { anggota_id } = req.params;

    const pool = await getPool();

    const result = await pool.request()
      .input('anggota_id', anggota_id)
      .query(`
        SELECT
          id,
          periode,
          status_keaktifan,
          tanggal_aktif,
          tanggal_nonaktif
        FROM anggota_ukm
        WHERE anggota_id = @anggota_id
        ORDER BY periode DESC
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

module.exports = {
  getAll,
  create,
  updateStatus,
  getHistory,
};