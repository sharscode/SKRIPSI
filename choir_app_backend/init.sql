-- ============================================================
-- ⚠️  SCRIPT LAMA (v1) — JANGAN DIJALANKAN
-- ============================================================
-- Berkas ini TIDAK lagi mencerminkan skema aplikasi. Kekurangannya:
--   * admin di-seed sebagai 'superadmin@choirapp.com' (yang benar: 'superadmin@pcu.ac.id')
--   * tabel 'anggota_ukm' dan 'notification' belum ada
--   * kolom 'updated_at' pada beberapa tabel belum ada
-- Menjalankan berkas ini menghasilkan database yang tidak bisa dipakai login
-- dan membuat modul Keanggotaan UKM serta Notifikasi gagal.
--
-- ➜  Gunakan  database/init.sql  (v2.0), lalu jalankan berkas di
--    database/migrations/  sesuai urutan tanggalnya.
--
-- Disimpan hanya sebagai arsip riwayat.
-- ============================================================

-- ============================================================
-- CHOIR APP - SQL Server Database Initialization Script (v1, arsip)
-- ============================================================

-- 1. Buat database (skip jika sudah ada)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'choir_app')
BEGIN
    CREATE DATABASE choir_app;
END
GO

USE choir_app;
GO

-- ============================================================
-- DROP TABLES (urutan sesuai dependency FK)
-- ============================================================
IF OBJECT_ID('absensi', 'U') IS NOT NULL DROP TABLE absensi;
IF OBJECT_ID('dokumentasi', 'U') IS NOT NULL DROP TABLE dokumentasi;
IF OBJECT_ID('acara_partitur', 'U') IS NOT NULL DROP TABLE acara_partitur;
IF OBJECT_ID('peserta_acara', 'U') IS NOT NULL DROP TABLE peserta_acara;
IF OBJECT_ID('latihan', 'U') IS NOT NULL DROP TABLE latihan;
IF OBJECT_ID('acara', 'U') IS NOT NULL DROP TABLE acara;
IF OBJECT_ID('partitur', 'U') IS NOT NULL DROP TABLE partitur;
IF OBJECT_ID('anggota', 'U') IS NOT NULL DROP TABLE anggota;
IF OBJECT_ID('admin', 'U') IS NOT NULL DROP TABLE admin;
IF OBJECT_ID('settings', 'U') IS NOT NULL DROP TABLE settings;
GO

-- ============================================================
-- CREATE TABLES dengan IDENTITY (auto increment)
-- ============================================================

CREATE TABLE admin (
    id          INT IDENTITY(1,1) NOT NULL,
    nama        VARCHAR(100)  NOT NULL,
    email       VARCHAR(100)  NOT NULL,
    password    VARCHAR(255)  NOT NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT 'admin',  -- 'admin' | 'super_admin'
    created_at  DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT admin_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT admin_email_UQ UNIQUE (email),
    CONSTRAINT admin_role_CK CHECK (role IN ('admin', 'super_admin'))
);
GO

CREATE TABLE settings (
    id INT IDENTITY(1,1) NOT NULL,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NULL,
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT settings_PK PRIMARY KEY CLUSTERED (id)
);
GO

CREATE TABLE anggota (
    id            INT IDENTITY(1,1) NOT NULL,
    nrp           VARCHAR(20)   NOT NULL,
    nama_lengkap  VARCHAR(100)  NOT NULL,
    bagian_suara  VARCHAR(20)   NOT NULL,
    alamat        VARCHAR(255)  NULL,
    kontak        VARCHAR(20)   NOT NULL,
    email         VARCHAR(100)  NOT NULL,
    password      VARCHAR(255)  NOT NULL,
    tanggal_lahir DATE          NULL,
    jurusan       VARCHAR(100)  NULL,
    created_at    DATETIME      NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME      NULL,
    CONSTRAINT anggota_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT anggota_nrp_UQ UNIQUE (nrp),
    CONSTRAINT anggota_email_UQ UNIQUE (email),
    CONSTRAINT anggota_bagian_suara_CK CHECK (bagian_suara IN ('sopran', 'alto', 'tenor', 'bass'))
);
GO

CREATE TABLE partitur (
    id            INT IDENTITY(1,1) NOT NULL,
    judul         VARCHAR(150)  NOT NULL,
    komposer      VARCHAR(100)  NOT NULL,
    jumlah_suara  INT           NOT NULL,
    jenis_lagu    VARCHAR(50)   NOT NULL,
    file_pdf      VARCHAR(255)  NOT NULL,
    created_at    DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT partitur_PK PRIMARY KEY CLUSTERED (id)
);
GO

CREATE TABLE acara (
    id                INT IDENTITY(1,1) NOT NULL,
    nama_acara        VARCHAR(150)  NOT NULL,
    tanggal           DATE          NOT NULL,
    jenis_kegiatan    VARCHAR(50)   NOT NULL,
    lokasi            VARCHAR(150)  NOT NULL,
    penyelenggara     VARCHAR(100)  NOT NULL,
    penanggung_jawab  VARCHAR(100)  NOT NULL,
    jenis_skkk        VARCHAR(50)   NOT NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'aktif',
    created_at        DATETIME      NOT NULL DEFAULT GETDATE(),
    created_by        INT           NOT NULL,
    CONSTRAINT acara_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT acara_status_CK CHECK (status IN ('aktif', 'selesai', 'dibatalkan')),
    CONSTRAINT acara_admin_FK FOREIGN KEY (created_by) REFERENCES admin(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE TABLE acara_partitur (
    id          INT IDENTITY(1,1) NOT NULL,
    acara_id    INT NOT NULL,
    partitur_id INT NOT NULL,
    CONSTRAINT acara_partitur_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT acara_partitur_UQ UNIQUE (acara_id, partitur_id),
    CONSTRAINT acara_partitur_acara_FK FOREIGN KEY (acara_id) REFERENCES acara(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT acara_partitur_partitur_FK FOREIGN KEY (partitur_id) REFERENCES partitur(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE TABLE peserta_acara (
    id                INT IDENTITY(1,1) NOT NULL,
    status_peserta    VARCHAR(20)   NULL,
    approval_status   VARCHAR(20)   NOT NULL DEFAULT 'menunggu',
    alasan_perubahan  VARCHAR(255)  NULL,
    anggota_id        INT           NOT NULL,
    acara_id          INT           NOT NULL,
    approved_by       INT           NOT NULL,
    CONSTRAINT peserta_acara_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT peserta_acara_UQ UNIQUE (anggota_id, acara_id),
    CONSTRAINT peserta_status_CK CHECK (status_peserta IN ('ikut', 'batal')),
    CONSTRAINT peserta_approval_CK CHECK (approval_status IN ('menunggu', 'disetujui', 'ditolak')),
    CONSTRAINT peserta_acara_anggota_FK FOREIGN KEY (anggota_id) REFERENCES anggota(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT peserta_acara_acara_FK FOREIGN KEY (acara_id) REFERENCES acara(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT peserta_acara_admin_FK FOREIGN KEY (approved_by) REFERENCES admin(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE TABLE latihan (
    id                INT IDENTITY(1,1) NOT NULL,
    tanggal           DATE          NOT NULL,
    jam               VARCHAR(8)    NOT NULL,   -- format HH:MM:SS
    lokasi            VARCHAR(150)  NOT NULL,
    keterangan        VARCHAR(255)  NULL,
    tipe_latihan      VARCHAR(20)   NOT NULL,
    waktu_notifikasi  INT           NOT NULL DEFAULT 60,  -- menit sebelum latihan
    created_by        INT           NOT NULL,
    acara_id          INT           NOT NULL,
    CONSTRAINT latihan_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT latihan_tipe_CK CHECK (tipe_latihan IN ('rutin', 'sekali')),
    CONSTRAINT latihan_admin_FK FOREIGN KEY (created_by) REFERENCES admin(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT latihan_acara_FK FOREIGN KEY (acara_id) REFERENCES acara(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE TABLE absensi (
    id            INT IDENTITY(1,1) NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'alpha',
    waktu_checkin DATETIME      NOT NULL DEFAULT GETDATE(),
    qr_token      VARCHAR(255)  NOT NULL,
    latihan_id    INT           NOT NULL,
    anggota_id    INT           NOT NULL,
    CONSTRAINT absensi_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT absensi_UQ UNIQUE (latihan_id, anggota_id),
    CONSTRAINT absensi_status_CK CHECK (status IN ('hadir', 'alpha', 'izin', 'sakit')),
    CONSTRAINT absensi_anggota_FK FOREIGN KEY (anggota_id) REFERENCES anggota(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT absensi_latihan_FK FOREIGN KEY (latihan_id) REFERENCES latihan(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE TABLE dokumentasi (
    id          INT IDENTITY(1,1) NOT NULL,
    file_path   VARCHAR(255)  NOT NULL,
    keterangan  VARCHAR(255)  NULL,
    uploaded_at DATETIME      NOT NULL DEFAULT GETDATE(),
    acara_id    INT           NOT NULL,
    CONSTRAINT dokumentasi_PK PRIMARY KEY CLUSTERED (id),
    CONSTRAINT dokumentasi_acara_FK FOREIGN KEY (acara_id) REFERENCES acara(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

-- ============================================================
-- INDEXES untuk performa query
-- ============================================================
CREATE INDEX IX_anggota_bagian_suara ON anggota(bagian_suara);
CREATE INDEX IX_acara_status ON acara(status);
CREATE INDEX IX_acara_tanggal ON acara(tanggal);
CREATE INDEX IX_latihan_acara_id ON latihan(acara_id);
CREATE INDEX IX_latihan_tanggal ON latihan(tanggal);
CREATE INDEX IX_absensi_latihan_id ON absensi(latihan_id);
CREATE INDEX IX_absensi_anggota_id ON absensi(anggota_id);
CREATE INDEX IX_peserta_acara_acara_id ON peserta_acara(acara_id);
CREATE INDEX IX_peserta_acara_anggota_id ON peserta_acara(anggota_id);
GO

-- ============================================================
-- SEED DATA
-- Password: Admin123! (bcrypt hash)
-- Generate ulang dengan: node -e "const b=require('bcryptjs');b.hash('Admin123!',12).then(console.log)"
-- ============================================================

INSERT INTO admin (nama, email, password, role) VALUES
(
    'Super Admin',
    'superadmin@choirapp.com',
    '$2a$12$EGB8/g3BzAdkNwZ6vMBUJONqN6RHIlUfpQwYWZAzAD3ce0RygAMpm',
    'super_admin'
),
(
    'Admin Paduan Suara',
    'admin@choirapp.com',
    '$2a$12$EGB8/g3BzAdkNwZ6vMBUJONqN6RHIlUfpQwYWZAzAD3ce0RygAMpm',
    'admin'
);
GO

INSERT INTO settings (setting_key, setting_value) VALUES 
('active_periode', '2025/2026');
GO

-- Password anggota: Member123! (bcrypt hash)
INSERT INTO anggota (nrp, nama_lengkap, bagian_suara, alamat, kontak, email, password) VALUES
('C14220298', 'Eve Adams',     'alto',    'Jl. Pemuda No. 3, Surabaya',     '08123456003', 'eve@choirapp.com',    '$2a$12$0yvc12OXInOsw/TJXek3UOJvxlCIrqVIRjXkDmzbBxN2vSDXgFlgO'),
('H12200211', 'John Doe',      'tenor',   'Jl. Merdeka No. 1, Surabaya',    '08123456001', 'john@choirapp.com',   '$2a$12$0yvc12OXInOsw/TJXek3UOJvxlCIrqVIRjXkDmzbBxN2vSDXgFlgO'),
('C14220123', 'Olivia Smith',  'sopran',  'Jl. Pahlawan No. 2, Surabaya',   '08123456002', 'olivia@choirapp.com', '$2a$12$0yvc12OXInOsw/TJXek3UOJvxlCIrqVIRjXkDmzbBxN2vSDXgFlgO'),
('E12210023', 'Bob Jones',     'bass',    'Jl. Diponegoro No. 4, Surabaya', '08123456004', 'bob@choirapp.com',    '$2a$12$0yvc12OXInOsw/TJXek3UOJvxlCIrqVIRjXkDmzbBxN2vSDXgFlgO'),
('D13230321', 'Emily Clark',   'sopran',  'Jl. Sudirman No. 5, Surabaya',   '08123456005', 'emily@choirapp.com',  '$2a$12$0yvc12OXInOsw/TJXek3UOJvxlCIrqVIRjXkDmzbBxN2vSDXgFlgO'),
('A11240070', 'Noah Taylor',   'tenor',   'Jl. Gatot Subroto No. 6, Sby',   '08123456006', 'noah@choirapp.com',   '$2a$12$0yvc12OXInOsw/TJXek3UOJvxlCIrqVIRjXkDmzbBxN2vSDXgFlgO');
GO

INSERT INTO partitur (judul, komposer, jumlah_suara, jenis_lagu, file_pdf) VALUES
('O Magnum Mysterium',  'Tomas Luis de Victoria',  4, 'sacral',  'uploads/partitur/sample1.pdf'),
('Hallelujah',          'Leonard Cohen arr.',      4, 'populer', 'uploads/partitur/sample2.pdf'),
('Lir-Ilir',            'Sunan Kalijaga arr.',     4, 'daerah',  'uploads/partitur/sample3.pdf');
GO

INSERT INTO acara (nama_acara, tanggal, jenis_kegiatan, lokasi, penyelenggara, penanggung_jawab, jenis_skkk, status, created_by) VALUES
(
    'Konser Natal 2025',
    '2025-12-20',
    'Konser',
    'Petra Performance Hall',
    'Paduan Suara Mahasiswa',
    'Pak Aris',
    'Bakat & Minat',
    'aktif',
    1
),
(
    'Perayaan Dies Natalis',
    '2025-11-10',
    'Upacara',
    'Auditorium Q',
    'Rektorat',
    'Bu Caren',
    'Pengabdian Masyarakat',
    'selesai',
    1
);
GO

INSERT INTO acara_partitur (acara_id, partitur_id) VALUES
(1, 1), (1, 2), (2, 3);
GO

INSERT INTO latihan (tanggal, jam, lokasi, keterangan, tipe_latihan, waktu_notifikasi, acara_id, created_by) VALUES
('2025-12-01', '18:00:00', 'Gedung EH.401', 'Latihan rutin mingguan',    'rutin',  60, 1, 1),
('2025-12-08', '18:00:00', 'Gedung EH.405', 'Latihan fokus partitur 1',  'rutin',  60, 1, 1),
('2025-12-15', '18:00:00', 'Petra Performance Hall',    'Gladi bersih full dress',   'sekali', 120, 1, 1);
GO

INSERT INTO peserta_acara (anggota_id, acara_id, status_peserta, approval_status, approved_by) VALUES
(1, 1, 'ikut', 'disetujui', 1),
(2, 1, 'ikut', 'disetujui', 1),
(3, 1, 'ikut', 'disetujui', 1),
(4, 1, 'ikut', 'disetujui', 1),
(5, 1, 'ikut', 'disetujui', 1),
(6, 1, 'ikut', 'disetujui', 1),
(1, 2, 'ikut', 'disetujui', 1),
(2, 2, 'ikut', 'disetujui', 1);
GO

PRINT '✅ Database choir_app berhasil diinisialisasi!';
PRINT '   Admin login  : superadmin@choirapp.com / Admin123!';
PRINT '   Anggota login: eve@choirapp.com / Member123!';
GO
