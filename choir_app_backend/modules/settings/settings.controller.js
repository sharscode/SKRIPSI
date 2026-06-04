const { getPool } = require('../../config/db');

// ======================================
// GET ACTIVE PERIODE
// ======================================
const getActivePeriode = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request()
      .query(`
        SELECT setting_value 
        FROM settings 
        WHERE setting_key = 'active_periode'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settings active_periode not found',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0].setting_value,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================
// UPDATE ACTIVE PERIODE
// ======================================
const updateActivePeriode = async (req, res) => {
  try {
    const { periode } = req.body;

    if (!periode) {
      return res.status(400).json({
        success: false,
        message: 'periode wajib diisi',
      });
    }

    const pool = await getPool();

    await pool.request()
      .input('periode', periode)
      .query(`
        UPDATE settings 
        SET setting_value = @periode, 
            updated_at = GETDATE()
        WHERE setting_key = 'active_periode'
      `);

    res.json({
      success: true,
      message: 'Active periode updated successfully',
      data: periode
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getActivePeriode,
  updateActivePeriode,
};
