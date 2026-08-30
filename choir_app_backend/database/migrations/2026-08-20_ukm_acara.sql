-- ============================================================
-- Migration: 2026-08-20_ukm_acara.sql
-- Description: Creates default 'UKM' event, saves setting 'ukm_acara_id',
--              and backfills existing routine practices to point to 'UKM' event.
-- ============================================================

USE choir_app;
GO

-- ── Langkah 1: Buat Acara "UKM" jika belum ada ──────────────
DECLARE @adminId INT;
SELECT TOP 1 @adminId = id FROM admin ORDER BY id ASC;

IF NOT EXISTS (SELECT 1 FROM acara WHERE nama_acara = 'UKM')
BEGIN
    INSERT INTO acara (
        nama_acara,
        tanggal,
        jenis_kegiatan,
        lokasi,
        penyelenggara,
        penanggung_jawab,
        jenis_skkk,
        status,
        created_by
    ) VALUES (
        'UKM',
        CAST(GETDATE() AS DATE),
        'UKM',
        'EH.405',
        'UKM Paduan Suara PCU',
        'Ketua UKM',
        'Bakat & Minat',
        'aktif',
        ISNULL(@adminId, 1)
    );
    PRINT '✅ Acara UKM berhasil dibuat.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Acara UKM sudah ada, melewati langkah 1.';
END
GO

-- ── Langkah 2: Simpan ID Acara "UKM" ke tabel settings ─────
DECLARE @ukmAcaraId INT;
SELECT @ukmAcaraId = id FROM acara WHERE nama_acara = 'UKM';

IF EXISTS (SELECT 1 FROM settings WHERE setting_key = 'ukm_acara_id')
BEGIN
    UPDATE settings
    SET setting_value = CAST(@ukmAcaraId AS VARCHAR(50)),
        updated_at = GETDATE()
    WHERE setting_key = 'ukm_acara_id';
    PRINT '✅ Setting ukm_acara_id berhasil diperbarui.';
END
ELSE
BEGIN
    INSERT INTO settings (setting_key, setting_value)
    VALUES ('ukm_acara_id', CAST(@ukmAcaraId AS VARCHAR(50)));
    PRINT '✅ Setting ukm_acara_id berhasil dibuat.';
END
GO

-- ── Langkah 3: Backfill data latihan rutin lama ────────────
DECLARE @ukmAcaraId INT;
SELECT @ukmAcaraId = id FROM acara WHERE nama_acara = 'UKM';

UPDATE latihan
SET acara_id = @ukmAcaraId
WHERE tipe_latihan = 'rutin' AND (acara_id IS NULL OR acara_id <> @ukmAcaraId);

PRINT '✅ Data latihan rutin lama berhasil terhubung ke Acara UKM.';
GO
