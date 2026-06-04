const { getPool } = require('../../config/db');


// 🔹 GET peserta per acara
const getByAcara = async (req, res) => {
  try {
    const { acara_id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('acara_id', acara_id)
      .query(`
        SELECT 
          pa.id,
          a.id AS anggota_id,
          a.nrp,
          a.nama_lengkap,
          a.bagian_suara,
          pa.status_peserta,
          pa.approval_status,
          pa.alasan_perubahan
        FROM peserta_acara pa
        JOIN anggota a ON pa.anggota_id = a.id
        WHERE pa.acara_id = @acara_id
        
        ORDER BY
        CASE pa.status_peserta
          WHEN 'ikut' THEN 1
          WHEN 'batal' THEN 2
          ELSE 99
        END,
        CASE LOWER(a.bagian_suara)
          WHEN 'sopran' THEN 1
          WHEN 'alto' THEN 2
          WHEN 'tenor' THEN 3
          WHEN 'bass' THEN 4
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


// 🔹 GET acara per anggota
const getByAnggota = async (req, res) => {
  try {
    const { anggota_id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('anggota_id', anggota_id)
      .query(`
        SELECT 
          pa.id,
          pa.acara_id,
          ac.nama_acara,
          ac.tanggal,
          ac.lokasi,
          ac.status AS status_acara,
          pa.status_peserta,
          pa.approval_status
        FROM peserta_acara pa
        JOIN acara ac ON pa.acara_id = ac.id
        WHERE pa.anggota_id = @anggota_id
        ORDER BY ac.tanggal DESC
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


// 🔹 CREATE (daftar acara)
const create = async (req, res) => {
  try {
    const { acara_id } = req.body;
    // Use the anggota_id from JWT token (so anggota can only register themselves)
    const anggota_id = req.user.id;
    const pool = await getPool();

    if (!acara_id) {
      return res.status(400).json({
        success: false,
        message: 'acara_id wajib diisi',
      });
    }

    // cek sudah daftar
    const check = await pool.request()
      .input('anggota_id', anggota_id)
      .input('acara_id', acara_id)
      .query(`
        SELECT id FROM peserta_acara
        WHERE anggota_id = @anggota_id AND acara_id = @acara_id
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sudah terdaftar di acara ini',
      });
    }

    await pool.request()
      .input('anggota_id', anggota_id)
      .input('acara_id', acara_id)
      .query(`
        INSERT INTO peserta_acara (
          anggota_id,
          acara_id,
          status_peserta,
          approval_status
        )
        VALUES (
          @anggota_id,
          @acara_id,
          'ikut',
          'menunggu'
        )
      `);

    res.json({
      success: true,
      message: 'Berhasil daftar acara',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 🔹 APPROVE / REJECT
const updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_status, alasan_perubahan } = req.body;

    const allowed = ['menunggu', 'disetujui', 'ditolak'];

    if (!allowed.includes(approval_status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid. Gunakan: menunggu, disetujui, ditolak',
      });
    }

    const pool = await getPool();

    const check = await pool.request()
      .input('id', id)
      .query(`SELECT id FROM peserta_acara WHERE id = @id`);

    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    await pool.request()
      .input('id', id)
      .input('approval_status', approval_status)
      .input('alasan_perubahan', alasan_perubahan || null)
      .query(`
        UPDATE peserta_acara
        SET
          approval_status = @approval_status,
          status_peserta =
            CASE
              WHEN @approval_status = 'disetujui' THEN 'ikut'
              WHEN @approval_status = 'ditolak' THEN 'batal'
              ELSE status_peserta
            END,
          alasan_perubahan =
            CASE
              WHEN @approval_status = 'ditolak'
              THEN @alasan_perubahan
              ELSE NULL
            END
        WHERE id = @id
      `);

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


// 🔹 UPDATE STATUS PESERTA (nonaktif)
const updateStatusPeserta = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_peserta } = req.body;

    if (!['ikut', 'batal', 'diganti'].includes(status_peserta)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid',
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('id', id)
      .input('status_peserta', status_peserta)
      .query(`
        UPDATE peserta_acara
        SET status_peserta = @status_peserta
        WHERE id = @id
        AND approval_status = 'disetujui'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        message: 'Peserta tidak ditemukan / belum approved',
      });
    }

    res.json({
      success: true,
      message: 'Status peserta berhasil diupdate',
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
      .query(`
        DELETE FROM peserta_acara WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Peserta berhasil dihapus',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const createManual = async (req, res) => {
  try {
    const { anggota_id, acara_id } = req.body;

    const pool = await getPool();

    const check = await pool.request()
      .input('anggota_id', anggota_id)
      .input('acara_id', acara_id)
      .query(`
        SELECT id, approval_status
        FROM peserta_acara
        WHERE anggota_id = @anggota_id
        AND acara_id = @acara_id
      `);

    // ==========================================
    // JIKA SUDAH ADA DATA LAMA
    // ==========================================
    if (check.recordset.length > 0) {
      const pesertaId = check.recordset[0].id;

      await pool.request()
        .input('id', pesertaId)
        .query(`
          UPDATE peserta_acara
          SET
            approval_status = 'disetujui',
            status_peserta = 'ikut',
            alasan_perubahan = NULL
          WHERE id = @id
        `);

      return res.json({
        success: true,
        message: 'Peserta berhasil diaktifkan',
      });
    }

    // ==========================================
    // JIKA BELUM ADA DATA
    // ==========================================
    await pool.request()
      .input('anggota_id', anggota_id)
      .input('acara_id', acara_id)
      .query(`
        INSERT INTO peserta_acara (
          anggota_id,
          acara_id,
          status_peserta,
          approval_status
        )
        VALUES (
          @anggota_id,
          @acara_id,
          'ikut',
          'disetujui'
        )
      `);

    res.json({
      success: true,
      message: 'Peserta berhasil ditambahkan',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


module.exports = {
  getByAcara,
  getByAnggota,
  create,
  createManual,
  updateApproval,
  updateStatusPeserta,
  remove,
};