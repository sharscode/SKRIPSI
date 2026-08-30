const { getPool, sql } = require('../../config/db');
const { syncPesertaUkm } = require('../../utils/ukmAcara');

async function getAll({ periode, status_keaktifan, search }) {
  const pool = await getPool();
  const req = pool.request();
  let where = 'WHERE 1=1';
  if (periode) { where += ' AND au.periode = @periode'; req.input('periode', sql.VarChar, periode); }
  if (status_keaktifan) { where += ' AND au.status_keaktifan = @status'; req.input('status', sql.VarChar, status_keaktifan); }
  if (search) { where += ' AND a.nama_lengkap LIKE @search'; req.input('search', sql.VarChar, `%${search}%`); }
  const result = await req.query(`
    SELECT au.id, au.anggota_id, au.periode, au.status_keaktifan, au.tanggal_aktif, au.tanggal_nonaktif,
           a.nrp, a.nama_lengkap, a.bagian_suara, a.email
    FROM anggota_ukm au
    JOIN anggota a ON au.anggota_id = a.id
    ${where} ORDER BY 
      CASE a.bagian_suara
        WHEN 'sopran' THEN 1
        WHEN 'alto' THEN 2
        WHEN 'tenor' THEN 3
        WHEN 'bass' THEN 4
        ELSE 5
      END,
      a.nama_lengkap ASC
  `);
  return result.recordset;
}

async function register({ anggota_id, periode }) {
  const pool = await getPool();
  const dup = await pool.request()
    .input('anggota_id', sql.Int, anggota_id).input('periode', sql.VarChar, periode)
    .query('SELECT id FROM anggota_ukm WHERE anggota_id=@anggota_id AND periode=@periode');
  if (dup.recordset.length > 0) throw { statusCode: 409, message: 'Anggota sudah terdaftar pada periode ini.' };
  const result = await pool.request()
    .input('anggota_id', sql.Int, anggota_id).input('periode', sql.VarChar, periode)
    .query(`INSERT INTO anggota_ukm (anggota_id, periode) OUTPUT INSERTED.* VALUES (@anggota_id, @periode)`);

  // Anggota aktif otomatis menjadi peserta acara "UKM" — wadah seluruh latihan rutin.
  // Kegagalan di sini tidak boleh membatalkan pendaftaran yang sudah tersimpan.
  try {
    await syncPesertaUkm();
  } catch (err) {
    console.error('[anggota_ukm] Gagal menyamakan peserta acara UKM:', err.message);
  }

  return result.recordset[0];
}

async function updateStatus(id, status_keaktifan) {
  const pool = await getPool();
  const tanggal_nonaktif = status_keaktifan === 'nonaktif' ? new Date().toISOString().split('T')[0] : null;
  await pool.request()
    .input('id', sql.Int, id).input('status', sql.VarChar, status_keaktifan)
    .input('tanggal_nonaktif', sql.Date, tanggal_nonaktif)
    .query(`UPDATE anggota_ukm SET status_keaktifan=@status, tanggal_nonaktif=@tanggal_nonaktif, updated_at=GETDATE() WHERE id=@id`);

  // Daftar peserta acara "UKM" harus selalu mencerminkan anggota yang aktif:
  // diaktifkan → masuk, dinonaktifkan → keluar.
  try {
    await syncPesertaUkm();
  } catch (err) {
    console.error('[anggota_ukm] Gagal menyamakan peserta acara UKM:', err.message);
  }
}

async function getHistory(anggota_id) {
  const pool = await getPool();
  const result = await pool.request().input('anggota_id', sql.Int, anggota_id)
    .query('SELECT * FROM anggota_ukm WHERE anggota_id=@anggota_id ORDER BY periode DESC');
  return result.recordset;
}

module.exports = { getAll, register, updateStatus, getHistory };
