-- ============================================================
-- Migration: Link every Latihan to an Acara
-- - Creates the fixed "UKM" acara (if it doesn't already exist).
-- - Stores its id in settings.ukm_acara_id so the backend can find it.
-- - Backfills existing 'rutin' (Latihan UKM) sessions to point at it.
-- Safe to re-run: every step is guarded with IF NOT EXISTS checks.
-- ============================================================

-- 1. Create the "UKM" acara if it doesn't exist yet.
IF NOT EXISTS (SELECT 1 FROM acara WHERE nama_acara = 'UKM')
BEGIN
    DECLARE @admin_id INT = (SELECT TOP 1 id FROM admin ORDER BY id ASC);
    INSERT INTO acara (nama_acara, tanggal, jenis_kegiatan, lokasi, penyelenggara, penanggung_jawab, jenis_skkk, status, created_by)
    VALUES ('UKM', CAST(GETDATE() AS DATE), 'UKM', 'EH.405', 'UKM Paduan Suara PCU', 'Ketua UKM', 'Bakat & Minat', 'aktif', @admin_id);
END
GO

-- 2. Point settings.ukm_acara_id at the "UKM" acara row.
DECLARE @ukm_id VARCHAR(10) = (SELECT CAST(id AS VARCHAR(10)) FROM acara WHERE nama_acara = 'UKM');
IF EXISTS (SELECT 1 FROM settings WHERE setting_key = 'ukm_acara_id')
    UPDATE settings SET setting_value = @ukm_id, updated_at = GETDATE() WHERE setting_key = 'ukm_acara_id';
ELSE
    INSERT INTO settings (setting_key, setting_value) VALUES ('ukm_acara_id', @ukm_id);
GO

-- 3. Backfill existing 'rutin' latihan rows to point at the "UKM" acara.
DECLARE @ukm_acara_id INT = (SELECT CAST(setting_value AS INT) FROM settings WHERE setting_key = 'ukm_acara_id');
UPDATE latihan SET acara_id = @ukm_acara_id WHERE tipe_latihan = 'rutin' AND (acara_id IS NULL OR acara_id <> @ukm_acara_id);
GO
