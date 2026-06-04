const { getPool } = require('../../config/db');
const bcrypt = require('bcrypt');

const loginAdmin = async (email, password) => {
  const pool = await getPool();

  const result = await pool.request()
    .input('email', email)
    .query(`
      SELECT * FROM admin
      WHERE email = @email
    `);

  const user = result.recordset[0];

  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return null;

  return user;
};

const loginAnggota = async (email, password) => {
  const pool = await getPool();

  const result = await pool.request()
    .input('email', email)
    .query(`
      SELECT * FROM anggota
      WHERE email = @email
    `);

  const user = result.recordset[0];

  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return null;

  return user;
};

module.exports = {
  loginAdmin,
  loginAnggota,
};