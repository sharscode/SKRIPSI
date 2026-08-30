-- ============================================================
-- Migration: 2026-08-31_latihan_wajib_acara.sql
-- Description: Setiap latihan wajib terhubung ke sebuah acara.
--              Latihan rutin diarahkan ke acara payung "UKM", dan
--              seluruh anggota aktif periode berjalan menjadi pesertanya.
-- Prasyarat  : 2026-08-20_ukm_acara.sql (pembuat acara "UKM")
-- ============================================================

USE choir_app;
GO

-- ── Langkah 1: Pastikan acara "UKM" ada dan tercatat di settings ──
DECLARE @ukmAcaraId INT;
SELECT TOP 1 @ukmAcaraId = id FROM acara WHERE nama_acara = 'UKM' ORDER BY id ASC;

IF @ukmAcaraId IS NULL
BEGIN
    RAISERROR('Acara "UKM" belum ada. Jalankan 2026-08-20_ukm_acara.sql lebih dulu.', 16, 1);
    RETURN;
END

IF EXISTS (SELECT 1 FROM settings WHERE setting_key = 'ukm_acara_id')
    UPDATE settings SET setting_value = CAST(@ukmAcaraId AS VARCHAR(50)), updated_at = GETDATE()
    WHERE setting_key = 'ukm_acara_id';
ELSE
    INSERT INTO settings (setting_key, setting_value)
    VALUES ('ukm_acara_id', CAST(@ukmAcaraId AS VARCHAR(50)));

PRINT 'Acara UKM id = ' + CAST(@ukmAcaraId AS VARCHAR(10));
GO

-- ── Langkah 2: Sambungkan semua latihan rutin yang masih yatim ──
DECLARE @ukmAcaraId INT;
SELECT @ukmAcaraId = TRY_CAST(setting_value AS INT) FROM settings WHERE setting_key = 'ukm_acara_id';

UPDATE latihan
SET acara_id = @ukmAcaraId
WHERE tipe_latihan = 'rutin'
  AND (acara_id IS NULL OR acara_id <> @ukmAcaraId);

PRINT 'Latihan rutin disambungkan ke acara UKM: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' baris.';
GO

-- ── Langkah 3: Latihan 'sekali' yang yatim ikut ke acara UKM ────
-- Tanpa acara, latihan ini tidak punya daftar peserta sama sekali dan
-- absensinya tidak pernah terbentuk. Menempelkannya ke UKM lebih baik
-- daripada membiarkannya menggantung.
DECLARE @ukmAcaraId INT;
SELECT @ukmAcaraId = TRY_CAST(setting_value AS INT) FROM settings WHERE setting_key = 'ukm_acara_id';

UPDATE latihan
SET acara_id = @ukmAcaraId
WHERE acara_id IS NULL;

PRINT 'Latihan sekali yatim dipindahkan ke acara UKM: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' baris.';
GO

-- ── Langkah 4: Anggota aktif menjadi peserta acara UKM ──────────
DECLARE @ukmAcaraId INT, @adminId INT;
SELECT @ukmAcaraId = TRY_CAST(setting_value AS INT) FROM settings WHERE setting_key = 'ukm_acara_id';
SELECT @adminId = created_by FROM acara WHERE id = @ukmAcaraId;

INSERT INTO peserta_acara (anggota_id, acara_id, approval_status, status_peserta, approved_by)
SELECT a.id, @ukmAcaraId, 'disetujui', 'ikut', @adminId
FROM anggota a
JOIN anggota_ukm au ON au.anggota_id = a.id
WHERE au.status_keaktifan = 'aktif'
  AND au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
  AND NOT EXISTS (
      SELECT 1 FROM peserta_acara pa
      WHERE pa.acara_id = @ukmAcaraId AND pa.anggota_id = a.id
  );

PRINT 'Anggota aktif ditambahkan sebagai peserta acara UKM: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' baris.';
GO

-- ── Langkah 5: Keluarkan peserta UKM yang sudah tidak aktif ─────
-- Riwayat kehadiran tidak ikut terhapus; absensi tidak bergantung
-- pada peserta_acara.
DECLARE @ukmAcaraId INT;
SELECT @ukmAcaraId = TRY_CAST(setting_value AS INT) FROM settings WHERE setting_key = 'ukm_acara_id';

DELETE FROM peserta_acara
WHERE acara_id = @ukmAcaraId
  AND anggota_id NOT IN (
      SELECT a.id
      FROM anggota a
      JOIN anggota_ukm au ON au.anggota_id = a.id
      WHERE au.status_keaktifan = 'aktif'
        AND au.periode = (SELECT setting_value FROM settings WHERE setting_key = 'active_periode')
  );

PRINT 'Peserta UKM non-aktif dikeluarkan: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' baris.';
GO

-- ── Langkah 6: Verifikasi tidak ada latihan yatim tersisa ───────
IF EXISTS (SELECT 1 FROM latihan WHERE acara_id IS NULL)
BEGIN
    RAISERROR('Masih ada latihan tanpa acara_id.', 16, 1);
END
ELSE
BEGIN
    PRINT 'Verifikasi lolos: semua latihan terhubung ke acara.';
END
GO

PRINT 'Migrasi latihan_wajib_acara selesai.';
GO
