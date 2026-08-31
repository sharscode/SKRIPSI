-- ============================================================
-- Migration: 2026-08-31_skkk_formulir_baka.sql
-- Description: Kolom-kolom yang dibutuhkan agar keluaran SKKK bisa
--              mengikuti formulir resmi BAKA (F01-PM05-BAKA-UKP rev. 00).
--
-- Formulir itu memuat enam field kepala dan tabel enam kolom. Sebagian
-- besar sudah dipegang sistem: NAMA KEGIATAN dari acara.nama_acara,
-- BIDANG dari acara.jenis_skkk (nilainya sudah persis sama), NRP dan NAMA
-- dari anggota, PERIODE dan LOGDATE dihitung dari tanggal cetak.
--
-- Yang belum ada hanya empat: JENIS KEPANITIAAN, LINGKUP, LEMBAGA, dan
-- JABATAN. Tiga yang pertama berlaku untuk satu acara, jadi disimpan di
-- tabel acara. JABATAN pada dasarnya juga seragam per pengajuan, tetapi
-- panitia sungguhan punya Ketua dan Sekretaris — karena itu disimpan
-- sebagai default di acara dengan kemungkinan ditimpa per peserta.
-- ============================================================

USE choir_app;
GO

-- ── Langkah 1: JENIS KEPANITIAAN ────────────────────────────
IF COL_LENGTH('acara', 'jenis_kepanitiaan') IS NULL
BEGIN
    ALTER TABLE acara ADD jenis_kepanitiaan VARCHAR(50) NULL;
    PRINT 'Kolom acara.jenis_kepanitiaan ditambahkan.';
END
ELSE
    PRINT 'Kolom acara.jenis_kepanitiaan sudah ada, dilewati.';
GO

-- ── Langkah 2: LINGKUP ──────────────────────────────────────
IF COL_LENGTH('acara', 'lingkup') IS NULL
BEGIN
    ALTER TABLE acara ADD lingkup VARCHAR(50) NULL;
    PRINT 'Kolom acara.lingkup ditambahkan.';
END
ELSE
    PRINT 'Kolom acara.lingkup sudah ada, dilewati.';
GO

-- ── Langkah 3: LEMBAGA ──────────────────────────────────────
IF COL_LENGTH('acara', 'lembaga') IS NULL
BEGIN
    ALTER TABLE acara ADD lembaga VARCHAR(100) NULL;
    PRINT 'Kolom acara.lembaga ditambahkan.';
END
ELSE
    PRINT 'Kolom acara.lembaga sudah ada, dilewati.';
GO

-- ── Langkah 4: JABATAN default seluruh peserta acara ────────
IF COL_LENGTH('acara', 'jabatan_default') IS NULL
BEGIN
    ALTER TABLE acara ADD jabatan_default VARCHAR(100) NULL;
    PRINT 'Kolom acara.jabatan_default ditambahkan.';
END
ELSE
    PRINT 'Kolom acara.jabatan_default sudah ada, dilewati.';
GO

-- ── Langkah 5: JABATAN dan DIVISI per peserta ───────────────
-- Dibiarkan NULL berarti "pakai default acara". Ini penting: kalau
-- di-backfill dengan nilai default, mengubah default acara nanti tidak
-- akan berpengaruh pada peserta yang sudah terdaftar.
IF COL_LENGTH('peserta_acara', 'jabatan') IS NULL
BEGIN
    ALTER TABLE peserta_acara ADD jabatan VARCHAR(100) NULL;
    PRINT 'Kolom peserta_acara.jabatan ditambahkan.';
END
ELSE
    PRINT 'Kolom peserta_acara.jabatan sudah ada, dilewati.';
GO

IF COL_LENGTH('peserta_acara', 'divisi') IS NULL
BEGIN
    ALTER TABLE peserta_acara ADD divisi VARCHAR(100) NULL;
    PRINT 'Kolom peserta_acara.divisi ditambahkan.';
END
ELSE
    PRINT 'Kolom peserta_acara.divisi sudah ada, dilewati.';
GO

-- ── Langkah 6: Nilai LEMBAGA bawaan ─────────────────────────
-- Masih menunggu konfirmasi nilai resmi untuk UKM Paduan Suara dari BAKA.
-- Sampai itu tiba, dipakai nilai yang muncul pada kedua contoh formulir.
-- Disimpan di settings supaya penggantiannya satu baris, tanpa menyentuh kode.
IF NOT EXISTS (SELECT 1 FROM settings WHERE setting_key = 'skkk_lembaga')
BEGIN
    INSERT INTO settings (setting_key, setting_value) VALUES ('skkk_lembaga', 'UP Lainnya');
    PRINT 'Setting skkk_lembaga dibuat (default "UP Lainnya").';
END
ELSE
    PRINT 'Setting skkk_lembaga sudah ada, dilewati.';
GO

-- ── Langkah 7: Isi acara lama agar tetap bisa dicetak ───────
-- Acara yang dibuat sebelum migrasi ini tidak punya nilainya. Tanpa
-- pengisian, formulirnya akan tercetak dengan field kepala kosong.
UPDATE acara SET jenis_kepanitiaan = 'Kurang dari 1 tahun' WHERE jenis_kepanitiaan IS NULL;
UPDATE acara SET lingkup           = 'Universitas'         WHERE lingkup           IS NULL;
UPDATE acara SET jabatan_default   = 'ANGGOTA UKM'             WHERE jabatan_default   IS NULL;
UPDATE acara SET lembaga = (SELECT setting_value FROM settings WHERE setting_key = 'skkk_lembaga')
  WHERE lembaga IS NULL;
PRINT 'Acara lama diisi nilai bawaan formulir.';
GO

-- ── Verifikasi ──────────────────────────────────────────────
IF COL_LENGTH('acara', 'jenis_kepanitiaan') IS NULL
   OR COL_LENGTH('acara', 'lingkup')           IS NULL
   OR COL_LENGTH('acara', 'lembaga')           IS NULL
   OR COL_LENGTH('acara', 'jabatan_default')   IS NULL
   OR COL_LENGTH('peserta_acara', 'jabatan')   IS NULL
   OR COL_LENGTH('peserta_acara', 'divisi')    IS NULL
BEGIN
    RAISERROR('Migrasi gagal: ada kolom formulir SKKK yang belum terbentuk.', 16, 1);
END
GO

PRINT 'Migrasi skkk_formulir_baka selesai.';
GO
