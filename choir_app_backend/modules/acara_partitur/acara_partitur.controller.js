const { getPool } = require('../../config/db');

// 🔹 ADD PARTITUR KE ACARA
const addToAcara = async (req, res) => {
  try {
    const { acara_id, partitur_id } = req.body;

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
      message: 'Partitur berhasil ditambahkan ke acara',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { addToAcara };