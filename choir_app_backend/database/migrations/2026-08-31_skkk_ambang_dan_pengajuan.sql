-- ============================================================
-- Migration: 2026-08-31_skkk_ambang_dan_pengajuan.sql
-- Description: Ambang kehadiran minimum untuk SKKK, dan penanda
--              apakah SKKK sebuah acara sudah diajukan ke BAKA.
-- ============================================================

USE choir_app;
GO

-- ── Langkah 1: Ambang kehadiran minimum SKKK ────────────────
-- Selama ini sistem hanya menghitung persentase kehadiran tanpa menilai
-- layak atau tidak, sehingga pengurus masih harus memilah manual.
-- Nilainya disimpan di settings agar bisa diubah tanpa mengubah kode.
IF NOT EXISTS (SELECT 1 FROM settings WHERE setting_key = 'min_kehadiran_skkk')
BEGIN
    INSERT INTO settings (setting_key, setting_value) VALUES ('min_kehadiran_skkk', '75');
    PRINT 'Setting min_kehadiran_skkk dibuat (default 75%).';
END
ELSE
BEGIN
    PRINT 'Setting min_kehadiran_skkk sudah ada, dilewati.';
END
GO

-- ── Langkah 2: Penanda pengajuan SKKK pada acara ────────────
-- Cukup berupa status, bukan tabel terpisah: tidak ada isi yang perlu
-- direvisi, hanya "kapan diajukan" dan "oleh siapa".
IF COL_LENGTH('acara', 'skkk_diajukan_at') IS NULL
BEGIN
    ALTER TABLE acara ADD skkk_diajukan_at DATETIME NULL;
    PRINT 'Kolom acara.skkk_diajukan_at ditambahkan.';
END
GO

IF COL_LENGTH('acara', 'skkk_diajukan_by') IS NULL
BEGIN
    ALTER TABLE acara ADD skkk_diajukan_by INT NULL;
    ALTER TABLE acara ADD CONSTRAINT fk_acara_skkk_admin
        FOREIGN KEY (skkk_diajukan_by) REFERENCES admin(id);
    PRINT 'Kolom acara.skkk_diajukan_by ditambahkan.';
END
GO

PRINT 'Migrasi skkk_ambang_dan_pengajuan selesai.';
GO
