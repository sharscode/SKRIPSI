const { getPool, sql } = require('../../config/db');
const notificationService = require('../notification/notification.service');
const { getUkmAcaraId } = require('../../utils/ukmAcara');

async function getAll(query = {}) {
  const pool = await getPool();
  const req = pool.request();
  let whereClause = 'WHERE 1=1';

  if (query.exclude_partitur_id) {
    whereClause += ' AND a.id NOT IN (SELECT ap.acara_id FROM acara_partitur ap WHERE ap.partitur_id = @exclude_partitur_id)';
    req.input('exclude_partitur_id', sql.Int, +query.exclude_partitur_id);
  }

  if (query.status) {
    whereClause += ' AND a.status = @status';
    req.input('status', sql.VarChar, query.status);
  }

  const result = await req.query(`
    SELECT a.id, a.nama_acara, a.tanggal, a.jenis_kegiatan, a.lokasi, a.penyelenggara,
           a.penanggung_jawab, a.jenis_skkk, a.status, a.created_at,
           ad.nama AS created_by_nama,
           (SELECT COUNT(*) FROM latihan l WHERE l.acara_id = a.id) AS jumlah_latihan,
           (SELECT COUNT(*) FROM peserta_acara pa WHERE pa.acara_id = a.id AND pa.approval_status = 'disetujui') AS jumlah_peserta,
           -- Penanda acara payung "UKM". Klien memakainya untuk menyembunyikan
           -- acara ini dari pilihan yang tidak relevan (mis. latihan sekali).
           CAST(CASE WHEN a.id = (
                  SELECT TRY_CAST(setting_value AS INT) FROM settings WHERE setting_key = 'ukm_acara_id'
                ) THEN 1 ELSE 0 END AS BIT) AS is_ukm
    FROM acara a JOIN admin ad ON a.created_by = ad.id
    ${whereClause}
    ORDER BY 
      CASE a.status 
        WHEN 'aktif' THEN 1 
        WHEN 'selesai' THEN 2 
        WHEN 'dibatalkan' THEN 3 
        ELSE 4 
      END ASC, 
      a.tanggal DESC
  `);
  return result.recordset;
}

async function getById(id) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT a.*, ad.nama AS created_by_nama
    FROM acara a JOIN admin ad ON a.created_by = ad.id WHERE a.id = @id
  `);
  if (result.recordset.length === 0) throw { statusCode: 404, message: 'Acara tidak ditemukan.' };
  return result.recordset[0];
}

/**
 * "UKM" adalah nama acara sistem — wadah tetap seluruh latihan rutin, dirujuk
 * lewat settings.ukm_acara_id. Kalau ada acara kedua bernama sama, pencarian
 * cadangan berdasarkan nama jadi ambigu dan latihan rutin bisa nyasar.
 * Nama ini karena itu dikunci.
 *
 * @param {string} nama
 * @param {number} [selfId] - id acara yang sedang diubah (boleh mempertahankan namanya)
 */
async function assertNamaBukanUkmCadangan(nama, selfId) {
  if (String(nama || '').trim().toLowerCase() !== 'ukm') return;

  const ukmId = await getUkmAcaraId().catch(() => null);
  if (selfId && ukmId && selfId === ukmId) return; // acara UKM itu sendiri

  throw {
    statusCode: 409,
    message: 'Nama "UKM" dipakai acara sistem untuk menampung latihan rutin. Pakai nama lain.',
  };
}

/**
 * Batas periode akademik yang memuat sebuah tanggal.
 * Periode berjalan 1 Agustus s/d 31 Juli, sesuai penamaan 'YYYY/YYYY' di settings.
 *
 * @param {string|Date} tanggal
 * @returns {{mulai: string, selesai: string, label: string}}
 */
function batasPeriode(tanggal) {
  const d = new Date(tanggal);
  const tahunMulai = d.getMonth() + 1 >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return {
    mulai: `${tahunMulai}-08-01`,
    selesai: `${tahunMulai + 1}-07-31`,
    label: `${tahunMulai}/${tahunMulai + 1}`,
  };
}

/**
 * Cari acara lain bernama sama pada periode akademik yang sama.
 *
 * Nama kembar tidak dilarang — acara paduan suara memang berulang tiap tahun
 * ("Konser Natal", "Paskah"). Yang berbahaya adalah dua acara bernama sama di
 * periode yang sama: daftar pilihan hanya menampilkan nama dan tanggal, jadi
 * admin bisa salah pilih tanpa sadar dan persetujuan peserta masuk ke acara keliru.
 */
async function cariAcaraNamaKembar(nama, tanggal, selfId) {
  const bersih = String(nama || '').trim();
  if (!bersih || !tanggal) return { periode: null, acara: [] };

  const { mulai, selesai, label } = batasPeriode(tanggal);
  const pool = await getPool();
  const req = pool.request()
    .input('nama', sql.VarChar, bersih)
    .input('mulai', sql.Date, mulai)
    .input('selesai', sql.Date, selesai);

  let where = `WHERE LOWER(LTRIM(RTRIM(a.nama_acara))) = LOWER(@nama)
               AND a.tanggal BETWEEN @mulai AND @selesai`;
  if (selfId) {
    where += ' AND a.id <> @self_id';
    req.input('self_id', sql.Int, selfId);
  }

  const result = await req.query(`
    SELECT a.id, a.nama_acara, a.tanggal, a.status
    FROM acara a
    ${where}
    ORDER BY a.tanggal ASC
  `);
  return { periode: label, acara: result.recordset };
}

/**
 * Lempar peringatan bila ada nama kembar, kecuali admin sudah menegaskan lanjut.
 * Sengaja bukan penolakan permanen: klien menampilkan konfirmasi lalu mengirim
 * ulang dengan abaikan_kembar = true.
 */
async function peringatkanNamaKembar(data, selfId) {
  if (data.abaikan_kembar === true || data.abaikan_kembar === 'true') return;

  const kembar = await cariAcaraNamaKembar(data.nama_acara, data.tanggal, selfId);
  if (kembar.acara.length === 0) return;

  throw {
    statusCode: 409,
    code: 'NAMA_ACARA_KEMBAR',
    message: `Sudah ada acara bernama "${String(data.nama_acara).trim()}" pada periode ${kembar.periode}.`,
    data: kembar.acara,
  };
}

async function create(data, adminId) {
  await assertNamaBukanUkmCadangan(data.nama_acara);
  await peringatkanNamaKembar(data);
  const pool = await getPool();
  const result = await pool.request()
    .input('nama_acara', sql.VarChar, data.nama_acara)
    .input('tanggal', sql.Date, data.tanggal)
    .input('jenis_kegiatan', sql.VarChar, data.jenis_kegiatan)
    .input('lokasi', sql.VarChar, data.lokasi)
    .input('penyelenggara', sql.VarChar, data.penyelenggara)
    .input('penanggung_jawab', sql.VarChar, data.penanggung_jawab)
    .input('jenis_skkk', sql.VarChar, data.jenis_skkk)
    // Field formulir SKKK BAKA. Dibiarkan jatuh ke bawaan bila belum diisi,
    // supaya acara tetap bisa dibuat tanpa memaksa pengurus mengisi enam
    // field administratif lebih dulu.
    .input('jenis_kepanitiaan', sql.VarChar, data.jenis_kepanitiaan || 'Kurang dari 1 tahun')
    .input('lingkup', sql.VarChar, data.lingkup || 'Universitas')
    .input('lembaga', sql.VarChar, data.lembaga || null)
    .input('jabatan_default', sql.VarChar, data.jabatan_default || 'ANGGOTA UKM')
    .input('created_by', sql.Int, adminId)
    .query(`INSERT INTO acara (nama_acara, tanggal, jenis_kegiatan, lokasi, penyelenggara, penanggung_jawab,
              jenis_skkk, jenis_kepanitiaan, lingkup, lembaga, jabatan_default, created_by)
            OUTPUT INSERTED.id VALUES (@nama_acara, @tanggal, @jenis_kegiatan, @lokasi, @penyelenggara, @penanggung_jawab,
              @jenis_skkk, @jenis_kepanitiaan, @lingkup, @lembaga, @jabatan_default, @created_by)`);
  const acara = await getById(result.recordset[0].id);

  // Beritahu anggota aktif bahwa ada acara baru yang bisa diikuti.
  // Acara sudah tersimpan di titik ini, jadi kegagalan notifikasi tidak boleh
  // membatalkannya. Tapi kegagalannya wajib terlihat di log — kalau ditelan diam-diam,
  // acara bisa ada tanpa seorang pun tahu.
  try {
    await notificationService.sendToAnggotaAktif({
      judul: 'Acara Baru: ' + acara.nama_acara,
      pesan: 'Ada acara baru yang bisa kamu ikuti. Buka untuk melihat detail dan mendaftar.',
      tipe: 'info_acara',
      acara_id: acara.id,
    });
  } catch (err) {
    console.error(`[acara] Gagal mengirim notifikasi acara baru (id=${acara.id}):`, err.message);
  }

  return acara;
}

async function update(id, data) {
  await getById(id);
  await assertNamaBukanUkmCadangan(data.nama_acara, id);
  await peringatkanNamaKembar(data, id);
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .input('nama_acara', sql.VarChar, data.nama_acara)
    .input('tanggal', sql.Date, data.tanggal)
    .input('jenis_kegiatan', sql.VarChar, data.jenis_kegiatan)
    .input('lokasi', sql.VarChar, data.lokasi)
    .input('penyelenggara', sql.VarChar, data.penyelenggara)
    .input('penanggung_jawab', sql.VarChar, data.penanggung_jawab)
    .input('jenis_skkk', sql.VarChar, data.jenis_skkk)
    .input('jenis_kepanitiaan', sql.VarChar, data.jenis_kepanitiaan || 'Kurang dari 1 tahun')
    .input('lingkup', sql.VarChar, data.lingkup || 'Universitas')
    .input('lembaga', sql.VarChar, data.lembaga || null)
    .input('jabatan_default', sql.VarChar, data.jabatan_default || 'ANGGOTA UKM')
    .query(`UPDATE acara SET nama_acara=@nama_acara, tanggal=@tanggal, jenis_kegiatan=@jenis_kegiatan,
              lokasi=@lokasi, penyelenggara=@penyelenggara, penanggung_jawab=@penanggung_jawab,
              jenis_skkk=@jenis_skkk, jenis_kepanitiaan=@jenis_kepanitiaan, lingkup=@lingkup,
              lembaga=@lembaga, jabatan_default=@jabatan_default WHERE id=@id`);
  return getById(id);
}

async function updateStatus(id, status) {
  await getById(id);
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).input('status', sql.VarChar, status)
    .query('UPDATE acara SET status=@status WHERE id=@id');
}

async function remove(id) {
  await getById(id);
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).query('DELETE FROM acara WHERE id=@id');
}

module.exports = { getAll, getById, create, update, updateStatus, remove };
