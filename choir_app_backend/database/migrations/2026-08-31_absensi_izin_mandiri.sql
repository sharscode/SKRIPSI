-- ============================================================
-- Migration: 2026-08-31_absensi_izin_mandiri.sql
-- Description: Anggota dapat mengajukan izin/sakit sendiri dari aplikasi,
--              lengkap dengan alasannya.
-- ============================================================

USE choir_app;
GO

-- Selama ini status absensi hanya bisa diubah admin, sehingga anggota yang
-- berhalangan tetap harus menghubungi pengurus di luar sistem. Kolom ini
-- menampung alasan yang ditulis anggota saat mengajukan izin atau sakit.
IF COL_LENGTH('absensi', 'keterangan') IS NULL
BEGIN
    ALTER TABLE absensi ADD keterangan VARCHAR(255) NULL;
    PRINT 'Kolom absensi.keterangan ditambahkan.';
END
ELSE
BEGIN
    PRINT 'Kolom absensi.keterangan sudah ada, dilewati.';
END
GO

PRINT 'Migrasi absensi_izin_mandiri selesai.';
GO
