const { getPool } = require('../../config/db');


// 🔹 GET ALL
const getAll = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        id,
        judul,
        komposer,
        jumlah_suara,
        jenis_lagu,
        file_pdf,
        created_at
      FROM partitur
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


// 🔹 CREATE (UPLOAD FILE)
const create = async (req, res) => {
  try {
    const {
      judul,
      komposer,
      jumlah_suara,
      jenis_lagu,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File PDF wajib diupload',
      });
    }

    const filePath = `/uploads/partitur/${req.file.filename}`;

    const pool = await getPool();

    await pool.request()
      .input('judul', judul)
      .input('komposer', komposer)
      .input('jumlah_suara', jumlah_suara)
      .input('jenis_lagu', jenis_lagu)
      .input('file_pdf', filePath)
      .query(`
        INSERT INTO partitur
        (judul, komposer, jumlah_suara, jenis_lagu, file_pdf, created_at)
        VALUES
        (@judul, @komposer, @jumlah_suara, @jenis_lagu, @file_pdf, GETDATE())
      `);

    res.json({
      success: true,
      message: 'Partitur berhasil ditambahkan',
      file: filePath,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, komposer, jumlah_suara, jenis_lagu } = req.body;

    const pool = await getPool();

    await pool.request()
      .input('id', id)
      .input('judul', judul)
      .input('komposer', komposer)
      .input('jumlah_suara', jumlah_suara)
      .input('jenis_lagu', jenis_lagu)
      .query(`
        UPDATE partitur SET
          judul = @judul,
          komposer = @komposer,
          jumlah_suara = @jumlah_suara,
          jenis_lagu = @jenis_lagu
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Partitur berhasil diupdate',
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
      .query(`DELETE FROM partitur WHERE id = @id`);

    res.json({
      success: true,
      message: 'Partitur berhasil dihapus',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// 🔹 ADD PARTITUR KE ACARA
const addToAcara = async (req, res) => {
  try {
    const { acara_id, partitur_id } = req.body;

    if (!acara_id || !partitur_id) {
      return res.status(400).json({
        success: false,
        message: 'acara_id dan partitur_id wajib',
      });
    }

    const pool = await getPool();

    // cek duplicate
    const check = await pool.request()
      .input('acara_id', acara_id)
      .input('partitur_id', partitur_id)
      .query(`
        SELECT id FROM acara_partitur
        WHERE acara_id = @acara_id AND partitur_id = @partitur_id
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Partitur sudah ada di acara ini',
      });
    }

    await pool.request()
      .input('acara_id', acara_id)
      .input('partitur_id', partitur_id)
      .query(`
        INSERT INTO acara_partitur (acara_id, partitur_id)
        VALUES (@acara_id, @partitur_id)
      `);

    res.json({
      success: true,
      message: 'Berhasil ditambahkan ke acara',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getByAcara = async (req, res) => {
  try {
    const { acara_id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('acara_id', acara_id)
      .query(`
        SELECT 
          p.id,
          p.judul,
          p.komposer,
          p.jumlah_suara,
          p.jenis_lagu,
          p.file_pdf
        FROM acara_partitur ap
        JOIN partitur p ON ap.partitur_id = p.id
        WHERE ap.acara_id = @acara_id
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

const removeFromAcara = async (req, res) => {
  try {
    const { acara_id, partitur_id } = req.body;

    const pool = await getPool();

    await pool.request()
      .input('acara_id', acara_id)
      .input('partitur_id', partitur_id)
      .query(`
        DELETE FROM acara_partitur
        WHERE acara_id = @acara_id AND partitur_id = @partitur_id
      `);

    res.json({
      success: true,
      message: 'Partitur berhasil dihapus dari acara',
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
  update,
  remove,
  addToAcara,
  getByAcara,
  removeFromAcara,
};