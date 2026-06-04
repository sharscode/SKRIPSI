const { getPool } = require('../../config/db');


// 🔹 CHECK-IN
const checkIn = async (req, res) => {
  try {
    const { anggota_id, latihan_id } = req.body;

    const pool = await getPool();

    // 1. ambil acara dari latihan
    const latihan = await pool.request()
      .input('latihan_id', latihan_id)
      .query(`
        SELECT acara_id 
        FROM latihan 
        WHERE id = @latihan_id
      `);

    if (latihan.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Latihan tidak ditemukan',
      });
    }

    const acara_id = latihan.recordset[0].acara_id;

    // 2. cek peserta & approval
    const peserta = await pool.request()
      .input('anggota_id', anggota_id)
      .input('acara_id', acara_id)
      .query(`
        SELECT approval_status 
        FROM peserta_acara
        WHERE anggota_id = @anggota_id AND acara_id = @acara_id
      `);

    if (peserta.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Belum terdaftar di acara',
      });
    }

    if (peserta.recordset[0].approval_status !== 'disetujui') {
      return res.status(400).json({
        success: false,
        message: 'Belum di-approve',
      });
    }

    // 3. cek sudah absen belum
    const check = await pool.request()
      .input('anggota_id', anggota_id)
      .input('latihan_id', latihan_id)
      .query(`
        SELECT id FROM absensi
        WHERE anggota_id = @anggota_id AND latihan_id = @latihan_id
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sudah absen',
      });
    }

    // 4. insert absensi
    await pool.request()
      .input('anggota_id', anggota_id)
      .input('latihan_id', latihan_id)
      .input('status', 'hadir')
      .input('qr_token', 'manual')
      .query(`
        INSERT INTO absensi 
        (anggota_id, latihan_id, status, waktu_checkin, qr_token)
        VALUES 
        (@anggota_id, @latihan_id, @status, GETDATE(), @qr_token)
      `);

    res.json({
      success: true,
      message: 'Check-in berhasil',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// SCAN QR
const scanQR = async (req, res) => {
  try {
    const { token, anggota_id } = req.body;
    const pool = await getPool();

    const latihan = await pool.request()
      .input('token', token)
      .query(`
        SELECT id, tipe_latihan, acara_id, qr_expired_at
        FROM latihan
        WHERE qr_token = @token
      `);

    if (latihan.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'QR tidak valid',
      });
    }

    const data = latihan.recordset[0];

    if (new Date() > data.qr_expired_at) {
      return res.status(400).json({
        success: false,
        message: 'QR expired',
      });
    }

    // ======================
    // VALIDASI PESERTA
    // ======================
    if (data.tipe_latihan === 'rutin') {
      const cek = await pool.request()
        .input('anggota_id', anggota_id)
        .query(`
          SELECT id
          FROM anggota_ukm
          WHERE anggota_id = @anggota_id
          AND status_keaktifan = 'aktif'
          AND periode = (SELECT TOP 1 setting_value FROM settings WHERE setting_key = 'active_periode')
        `);

      if (cek.recordset.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Bukan anggota aktif',
        });
      }
    } else {
      const cek = await pool.request()
        .input('anggota_id', anggota_id)
        .input('acara_id', data.acara_id)
        .query(`
          SELECT id
          FROM peserta_acara
          WHERE anggota_id = @anggota_id
          AND acara_id = @acara_id
          AND approval_status = 'disetujui'
          AND status_peserta = 'ikut'
        `);

      if (cek.recordset.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak terdaftar acara',
        });
      }
    }

    // ======================
    // CEK DUPLIKAT
    // ======================
    const check = await pool.request()
      .input('anggota_id', anggota_id)
      .input('latihan_id', data.id)
      .query(`
        SELECT id
        FROM absensi
        WHERE anggota_id = @anggota_id
        AND latihan_id = @latihan_id
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sudah absen',
      });
    }

    // ======================
    // INSERT
    // ======================
    await pool.request()
      .input('anggota_id', anggota_id)
      .input('latihan_id', data.id)
      .input('token', token)
      .query(`
        INSERT INTO absensi
        (anggota_id, latihan_id, status, waktu_checkin, qr_token)
        VALUES
        (@anggota_id, @latihan_id, 'hadir', GETDATE(), @token)
      `);

    res.json({
      success: true,
      message: 'Absensi berhasil',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 🔹 GET ABSENSI PER LATIHAN
const getByLatihan = async (req, res) => {
  try {
    const { latihan_id } = req.params;
    const pool = await getPool();

    // Info latihan
    const latihan = await pool.request()
      .input('latihan_id', latihan_id)
      .query(`
        SELECT id, tipe_latihan, acara_id
        FROM latihan
        WHERE id = @latihan_id
      `);

    if (latihan.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Latihan tidak ditemukan',
      });
    }

    const dataLatihan =
      latihan.recordset[0];

    let query = '';

    // LATIHAN RUTIN
    if (
      dataLatihan.tipe_latihan ===
      'rutin'
    ) {
      query = `
        SELECT
          a.id AS anggota_id,
          a.nama_lengkap,
          a.bagian_suara,
          ISNULL(ab.status, 'alpha') AS status,
          ab.waktu_checkin

        FROM anggota_ukm au
        JOIN anggota a
          ON au.anggota_id = a.id

        LEFT JOIN absensi ab
          ON ab.anggota_id = a.id
         AND ab.latihan_id = @latihan_id

        WHERE au.status_keaktifan = 'aktif'
          AND au.periode = (SELECT TOP 1 setting_value FROM settings WHERE setting_key = 'active_periode')

        ORDER BY
          CASE a.bagian_suara
            WHEN 'Sopran' THEN 1
            WHEN 'Alto' THEN 2
            WHEN 'Tenor' THEN 3
            WHEN 'Bass' THEN 4
            ELSE 99
          END,
          a.nama_lengkap
      `;
    }

    // LATIHAN SEKALI / ACARA
    else {
      query = `
        SELECT
          a.id AS anggota_id,
          a.nama_lengkap,
          a.bagian_suara,
          ISNULL(ab.status, 'alpha') AS status,
          ab.waktu_checkin

        FROM peserta_acara pa
        JOIN anggota a
          ON pa.anggota_id = a.id

        LEFT JOIN absensi ab
          ON ab.anggota_id = a.id
         AND ab.latihan_id = @latihan_id

        WHERE pa.acara_id = @acara_id
          AND pa.approval_status = 'disetujui'
          AND pa.status_peserta = 'ikut'

        ORDER BY
          CASE a.bagian_suara
            WHEN 'Sopran' THEN 1
            WHEN 'Alto' THEN 2
            WHEN 'Tenor' THEN 3
            WHEN 'Bass' THEN 4
            ELSE 99
          END,
          a.nama_lengkap
      `;
    }

    const result =
      await pool.request()
        .input(
          'latihan_id',
          latihan_id
        )
        .input(
          'acara_id',
          dataLatihan.acara_id
        )
        .query(query);

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

const updateStatus = async (req, res) => {
  try {
    const { anggota_id, latihan_id, status } = req.body;

    const pool = await getPool();

    const check = await pool.request()
      .input('anggota_id', anggota_id)
      .input('latihan_id', latihan_id)
      .query(`
        SELECT id
        FROM absensi
        WHERE anggota_id=@anggota_id
        AND latihan_id=@latihan_id
      `);

    if (check.recordset.length > 0) {
      await pool.request()
        .input('anggota_id', anggota_id)
        .input('latihan_id', latihan_id)
        .input('status', status)
        .query(`
          UPDATE absensi
          SET status=@status,
              waktu_checkin =
                CASE
                  WHEN @status='hadir' THEN GETDATE()
                  ELSE NULL
                END
          WHERE anggota_id=@anggota_id
          AND latihan_id=@latihan_id
        `);
    } else {
      await pool.request()
        .input('anggota_id', anggota_id)
        .input('latihan_id', latihan_id)
        .input('status', status)
        .query(`
          INSERT INTO absensi
          (anggota_id, latihan_id, status, waktu_checkin, qr_token)
          VALUES (
            @anggota_id,
            @latihan_id,
            @status,
            CASE
              WHEN @status='hadir' THEN GETDATE()
              ELSE NULL
            END,
            'admin'
          )
        `);
    }

    res.json({
      success: true,
      message: 'Status updated',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 GET ABSENSI PER ANGGOTA
const getByAnggota = async (req, res) => {
  try {
    const { anggota_id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('anggota_id', anggota_id)
      .query(`
        SELECT combined.* FROM (
          -- ① RUTIN: semua latihan rutin + status anggota (LEFT JOIN, semua sesi tampil)
          SELECT 
            ab.id,
            l.id AS latihan_id,
            ISNULL(ab.status, 'alpha') AS status,
            ab.waktu_checkin,
            l.tanggal,
            l.jam,
            l.lokasi,
            l.tipe_latihan,
            CAST(NULL AS INT) AS acara_id,
            CAST(NULL AS VARCHAR(150)) AS nama_acara
          FROM latihan l
          LEFT JOIN absensi ab 
            ON ab.latihan_id = l.id 
            AND ab.anggota_id = @anggota_id
          WHERE l.tipe_latihan = 'rutin'

          UNION ALL

          -- ② SEKALI: hanya untuk acara yang disetujui + status anggota (LEFT JOIN)
          SELECT 
            ab.id,
            l.id AS latihan_id,
            ISNULL(ab.status, 'alpha') AS status,
            ab.waktu_checkin,
            l.tanggal,
            l.jam,
            l.lokasi,
            l.tipe_latihan,
            l.acara_id,
            a.nama_acara
          FROM peserta_acara pa
          JOIN latihan l ON l.acara_id = pa.acara_id
          JOIN acara a ON a.id = pa.acara_id
          LEFT JOIN absensi ab 
            ON ab.latihan_id = l.id 
            AND ab.anggota_id = @anggota_id
          WHERE pa.anggota_id = @anggota_id
            AND pa.approval_status IN ('disetujui', 'approved')
            AND l.tipe_latihan = 'sekali'
        ) combined
        ORDER BY combined.tanggal DESC
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
  checkIn,
  getByLatihan,
  updateStatus,
  getByAnggota,
  scanQR,
};