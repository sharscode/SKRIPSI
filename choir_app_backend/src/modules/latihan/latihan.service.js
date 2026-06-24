const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../../config/db');
const { generateQRDataURL } = require('../../utils/qrGenerator');

async function getAll({ tipe_latihan, acara_id }) {
  const pool = await getPool();
  const req = pool.request();
  let where = 'WHERE 1=1';
  if (tipe_latihan) { where += ' AND l.tipe_latihan=@tipe'; req.input('tipe', sql.VarChar, tipe_latihan); }
  if (acara_id) { where += ' AND l.acara_id=@acara_id'; req.input('acara_id', sql.Int, +acara_id); }
  const result = await req.query(`
    SELECT l.*, a.nama_acara, ad.nama as created_by_nama
    FROM latihan l
    LEFT JOIN acara a ON l.acara_id=a.id
    JOIN admin ad ON l.created_by=ad.id
    ${where} ORDER BY l.tanggal DESC
  `);
  return result.recordset;
}

async function getById(id) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT l.*, a.nama_acara FROM latihan l LEFT JOIN acara a ON l.acara_id=a.id WHERE l.id=@id`);
  if (!result.recordset[0]) throw { statusCode: 404, message: 'Latihan tidak ditemukan.' };
  return result.recordset[0];
}

async function syncAbsensiList(latihanId, tipe_latihan, acara_id) {
  const pool = await getPool();
  
  let memberIds = [];
  if (tipe_latihan === 'rutin') {
    const membersResult = await pool.request().query(`
      SELECT a.id FROM anggota a
      JOIN anggota_ukm au ON a.id = au.anggota_id
      WHERE au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
        AND au.status_keaktifan = 'aktif'
    `);
    memberIds = membersResult.recordset.map(r => r.id);
  } else if (tipe_latihan === 'sekali' && acara_id) {
    const membersResult = await pool.request()
      .input('acara_id', sql.Int, acara_id)
      .query(`
        SELECT anggota_id FROM peserta_acara
        WHERE acara_id = @acara_id AND approval_status = 'disetujui'
      `);
    memberIds = membersResult.recordset.map(r => r.anggota_id);
  }

  if (memberIds.length > 0) {
    for (const memberId of memberIds) {
      await pool.request()
        .input('latihan_id', sql.Int, latihanId)
        .input('anggota_id', sql.Int, memberId)
        .query(`
          IF NOT EXISTS (SELECT id FROM absensi WHERE latihan_id = @latihan_id AND anggota_id = @anggota_id)
          INSERT INTO absensi (status, latihan_id, anggota_id) VALUES ('alpha', @latihan_id, @anggota_id)
        `);
    }

    const memberIdString = memberIds.join(',');
    await pool.request()
      .input('latihan_id', sql.Int, latihanId)
      .query(`
        DELETE FROM absensi 
        WHERE latihan_id = @latihan_id 
          AND status = 'alpha'
          AND anggota_id NOT IN (${memberIdString})
      `);
  } else {
    await pool.request()
      .input('latihan_id', sql.Int, latihanId)
      .query("DELETE FROM absensi WHERE latihan_id = @latihan_id AND status = 'alpha'");
  }
}

async function sendLatihanNotifications(latihanId) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, latihanId).query(`
    SELECT l.*, a.nama_acara FROM latihan l LEFT JOIN acara a ON l.acara_id=a.id WHERE l.id=@id`);
  const l = result.recordset[0];
  if (!l) return;

  const dateStr = new Date(l.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  let memberIds = [];
  let pesan = '';
  if (l.tipe_latihan === 'rutin') {
    const membersResult = await pool.request().query(`
      SELECT a.id FROM anggota a
      JOIN anggota_ukm au ON a.id = au.anggota_id
      WHERE au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
        AND au.status_keaktifan = 'aktif'
    `);
    memberIds = membersResult.recordset.map(r => r.id);
    pesan = `Latihan UKM hari ${dateStr} pukul ${l.jam} WIB di ${l.lokasi}.`;
  } else if (l.tipe_latihan === 'sekali' && l.acara_id) {
    const membersResult = await pool.request()
      .input('acara_id', sql.Int, l.acara_id)
      .query(`
        SELECT anggota_id FROM peserta_acara
        WHERE acara_id = @acara_id AND approval_status = 'disetujui'
      `);
    memberIds = membersResult.recordset.map(r => r.anggota_id);
    pesan = `Latihan "${l.nama_acara}" hari ${dateStr} pukul ${l.jam} WIB di ${l.lokasi}.`;
  }

  const notificationService = require('../notification/notification.service');
  for (const memberId of memberIds) {
    try {
      await notificationService.send({
        judul: 'Pengingat Latihan',
        pesan: pesan,
        tipe: 'reminder_latihan',
        anggota_id: memberId,
        latihan_id: l.id,
        acara_id: l.acara_id || null
      });
    } catch (err) {
      console.error(`Failed to send notification to member ${memberId}:`, err);
    }
  }
}

async function create(data, adminId) {
  if (data.tipe_latihan === 'sekali' && !data.acara_id) throw { statusCode: 400, message: 'Latihan sekali harus memiliki acara_id.' };
  if (data.tipe_latihan === 'rutin' && data.acara_id) throw { statusCode: 400, message: 'Latihan rutin tidak boleh memiliki acara_id.' };
  const pool = await getPool();
  const result = await pool.request()
    .input('tanggal', sql.Date, data.tanggal).input('jam', sql.VarChar, data.jam)
    .input('lokasi', sql.VarChar, data.lokasi).input('keterangan', sql.VarChar, data.keterangan || null)
    .input('tipe_latihan', sql.VarChar, data.tipe_latihan)
    .input('waktu_notifikasi', sql.Int, +data.waktu_notifikasi || 60)
    .input('created_by', sql.Int, adminId).input('acara_id', sql.Int, data.acara_id || null)
    .query(`INSERT INTO latihan (tanggal, jam, lokasi, keterangan, tipe_latihan, waktu_notifikasi, created_by, acara_id)
            OUTPUT INSERTED.id VALUES (@tanggal, @jam, @lokasi, @keterangan, @tipe_latihan, @waktu_notifikasi, @created_by, @acara_id)`);
  
  const newLatihanId = result.recordset[0].id;
  await syncAbsensiList(newLatihanId, data.tipe_latihan, data.acara_id);

  try {
    await sendLatihanNotifications(newLatihanId);
  } catch (err) {
    console.error('Failed to send practice notifications:', err);
  }
  
  return getById(newLatihanId);
}

async function update(id, data) {
  await getById(id);
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id).input('tanggal', sql.Date, data.tanggal).input('jam', sql.VarChar, data.jam)
    .input('lokasi', sql.VarChar, data.lokasi).input('keterangan', sql.VarChar, data.keterangan || null)
    .input('tipe_latihan', sql.VarChar, data.tipe_latihan)
    .input('waktu_notifikasi', sql.Int, +data.waktu_notifikasi || 60)
    .input('acara_id', sql.Int, data.acara_id || null)
    .query('UPDATE latihan SET tanggal=@tanggal, jam=@jam, lokasi=@lokasi, keterangan=@keterangan, tipe_latihan=@tipe_latihan, waktu_notifikasi=@waktu_notifikasi, acara_id=@acara_id WHERE id=@id');
  
  await syncAbsensiList(id, data.tipe_latihan, data.acara_id);

  try {
    await sendLatihanNotifications(id);
  } catch (err) {
    console.error('Failed to send practice update notifications:', err);
  }
  
  return getById(id);
}

async function remove(id) {
  await getById(id);
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).query('DELETE FROM latihan WHERE id=@id');
}

async function generateQR(id) {
  await getById(id);
  const token = uuidv4();
  const expiredAt = new Date(Date.now() + 5 * 3000); // 15 seconds
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).input('token', sql.VarChar, token)
    .input('expired_at', sql.DateTime, expiredAt)
    .query('UPDATE latihan SET qr_token=@token, qr_expired_at=@expired_at WHERE id=@id');
  const qrDataURL = await generateQRDataURL({ token, latihan_id: id });
  return { token, qr_expired_at: expiredAt, qr_image: qrDataURL };
}

module.exports = { getAll, getById, create, update, remove, generateQR };
