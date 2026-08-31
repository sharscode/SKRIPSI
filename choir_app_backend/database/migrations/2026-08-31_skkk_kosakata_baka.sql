-- ============================================================
-- Migration: 2026-08-31_skkk_kosakata_baka.sql
-- Description: Menyelaraskan nilai field formulir SKKK dengan kosakata
--              resmi sistem SKKK Online BAKA.
--
-- Migrasi sebelumnya (skkk_formulir_baka) memakai nilai dugaan karena
-- daftar resminya belum tersedia. Setelah melihat form entry BAKA
-- langsung, dua di antaranya keliru:
--
--   LINGKUP           dugaan: Universitas / Fakultas / Program Studi
--                     resmi : Internasional, Nasional, Regional, Surabaya,
--                             Universitas, Fakultas, Intern
--   JENIS KEPANITIAAN dugaan: Kurang dari 1 Tahun / Lebih dari 1 Tahun
--                     resmi : 1 tahun, Kurang dari 1 tahun,
--                             Pengabdian Masyarakat
--
-- Selain itu form entry BAKA memasang JABATAN dan BIDANG sebagai pilihan
-- per peserta, bukan per kegiatan. Kolom bidang per peserta ditambahkan
-- di sini agar strukturnya sama.
-- ============================================================

USE choir_app;
GO

-- ── Langkah 1: BIDANG per peserta ───────────────────────────
-- NULL berarti "ikut jenis_skkk acara", sama seperti kolom jabatan.
IF COL_LENGTH('peserta_acara', 'bidang') IS NULL
BEGIN
    ALTER TABLE peserta_acara ADD bidang VARCHAR(50) NULL;
    PRINT 'Kolom peserta_acara.bidang ditambahkan.';
END
ELSE
    PRINT 'Kolom peserta_acara.bidang sudah ada, dilewati.';
GO

-- ── Langkah 2: Perbaiki nilai dugaan yang keliru ────────────
-- 'Lebih dari 1 Tahun' tidak ada dalam kosakata BAKA; padanannya '1 tahun'.
UPDATE acara SET jenis_kepanitiaan = '1 tahun'
  WHERE jenis_kepanitiaan = 'Lebih dari 1 Tahun';
UPDATE acara SET jenis_kepanitiaan = 'Kurang dari 1 tahun'
  WHERE jenis_kepanitiaan = 'Kurang dari 1 Tahun';

-- 'Program Studi' tidak ada dalam kosakata BAKA. Tidak ada padanan yang
-- pasti, jadi dijatuhkan ke 'Universitas' — nilai yang dipakai kedua
-- contoh formulir resmi — bukan ditebak ke 'Intern'.
UPDATE acara SET lingkup = 'Universitas' WHERE lingkup = 'Program Studi';

-- 'ANGGOTA' bukan nilai resmi. Untuk kegiatan UKM padanannya 'ANGGOTA UKM'.
UPDATE acara SET jabatan_default = 'ANGGOTA UKM' WHERE jabatan_default = 'ANGGOTA';
UPDATE peserta_acara SET jabatan = 'ANGGOTA UKM' WHERE jabatan = 'ANGGOTA';
PRINT 'Nilai jenis_kepanitiaan, lingkup, dan jabatan diselaraskan.';
GO

-- ── Langkah 3: BIDANG pada data lama ────────────────────────
-- Data seed memakai 'Kegiatan Minat & Bakat', nilai yang tidak pernah ada
-- di dropdown admin maupun di BAKA. Akibatnya acara seed tampil dengan
-- Jenis SKKK kosong saat diedit, dan kolom BIDANG formulir jadi salah nama.
UPDATE acara SET jenis_skkk = 'Bakat & Minat' WHERE jenis_skkk = 'Kegiatan Minat & Bakat';
PRINT 'Nilai jenis_skkk lama diselaraskan.';
GO

-- Sisa nilai di luar kosakata tidak dipaksa berubah — bisa jadi istilah sah
-- yang belum kita lihat. Cukup ditampilkan supaya tidak lolos tanpa disadari.
IF EXISTS (
    SELECT 1 FROM acara
    WHERE jenis_skkk NOT IN ('Organisasi & Kepemimpinan', 'Pengabdian Masyarakat',
                             'Partisipasi/Prestasi', 'Bakat & Minat', 'Penalaran')
)
BEGIN
    PRINT 'PERHATIAN: masih ada acara dengan jenis_skkk di luar kosakata BAKA:';
    SELECT DISTINCT jenis_skkk AS jenis_skkk_tak_dikenal FROM acara
    WHERE jenis_skkk NOT IN ('Organisasi & Kepemimpinan', 'Pengabdian Masyarakat',
                             'Partisipasi/Prestasi', 'Bakat & Minat', 'Penalaran');
END
GO

-- ── Verifikasi ──────────────────────────────────────────────
IF COL_LENGTH('peserta_acara', 'bidang') IS NULL
    RAISERROR('Migrasi gagal: kolom peserta_acara.bidang belum terbentuk.', 16, 1);
GO

IF EXISTS (
    SELECT 1 FROM acara
    WHERE jenis_kepanitiaan NOT IN ('1 tahun', 'Kurang dari 1 tahun', 'Pengabdian Masyarakat')
       OR lingkup NOT IN ('Internasional', 'Nasional', 'Regional', 'Surabaya',
                          'Universitas', 'Fakultas', 'Intern')
)
    RAISERROR('Migrasi gagal: masih ada acara dengan nilai di luar kosakata BAKA.', 16, 1);
GO

PRINT 'Migrasi skkk_kosakata_baka selesai.';
GO
