-- ============================================================
-- PCU Choir Management System — Database Initialization
-- Version: 2.0.0
-- Database: SQL Server 2019+
-- ============================================================

-- Create database (run separately if needed)
-- CREATE DATABASE choir_app;
-- GO
-- USE choir_app;
-- GO

-- ============================================================
-- DROP EXISTING TABLES (in reverse FK order)
-- ============================================================
IF OBJECT_ID('notification', 'U') IS NOT NULL DROP TABLE notification;
IF OBJECT_ID('dokumentasi', 'U') IS NOT NULL DROP TABLE dokumentasi;
IF OBJECT_ID('absensi', 'U') IS NOT NULL DROP TABLE absensi;
IF OBJECT_ID('latihan', 'U') IS NOT NULL DROP TABLE latihan;
IF OBJECT_ID('peserta_acara', 'U') IS NOT NULL DROP TABLE peserta_acara;
IF OBJECT_ID('acara_partitur', 'U') IS NOT NULL DROP TABLE acara_partitur;
IF OBJECT_ID('acara', 'U') IS NOT NULL DROP TABLE acara;
IF OBJECT_ID('partitur', 'U') IS NOT NULL DROP TABLE partitur;
IF OBJECT_ID('anggota_ukm', 'U') IS NOT NULL DROP TABLE anggota_ukm;
IF OBJECT_ID('anggota', 'U') IS NOT NULL DROP TABLE anggota;
IF OBJECT_ID('settings', 'U') IS NOT NULL DROP TABLE settings;
IF OBJECT_ID('admin', 'U') IS NOT NULL DROP TABLE admin;
GO

-- ============================================================
-- 1. ADMIN TABLE
-- ============================================================
CREATE TABLE admin (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nama        VARCHAR(100)  NOT NULL,
    email       VARCHAR(100)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT 'admin'
                CONSTRAINT chk_admin_role CHECK (role IN ('admin', 'super_admin')),
    created_at  DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at  DATETIME NULL
);
GO

-- ============================================================
-- 2. SETTINGS TABLE
-- ============================================================
CREATE TABLE settings (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    setting_key   VARCHAR(50)  NOT NULL UNIQUE,
    setting_value VARCHAR(255) NULL,
    updated_at    DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 3. ANGGOTA TABLE (Members)
-- ============================================================
CREATE TABLE anggota (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    nrp           VARCHAR(20)  NOT NULL UNIQUE,
    nama_lengkap  VARCHAR(100) NOT NULL,
    bagian_suara  VARCHAR(20)  NOT NULL
                  CONSTRAINT chk_anggota_suara CHECK (bagian_suara IN ('sopran','alto','tenor','bass')),
    alamat        VARCHAR(255) NULL,
    kontak        VARCHAR(20)  NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    foto_path     VARCHAR(255) NULL,
    fcm_token     VARCHAR(255) NULL,
    tanggal_lahir DATE         NULL,
    jurusan       VARCHAR(100) NULL,
    created_at    DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME NULL
);
GO

-- ============================================================
-- 4. ANGGOTA_UKM TABLE (Membership Periods)
-- ============================================================
CREATE TABLE anggota_ukm (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    anggota_id       INT NOT NULL,
    periode          VARCHAR(10)  NOT NULL,
    status_keaktifan VARCHAR(20)  NOT NULL DEFAULT 'aktif'
                     CONSTRAINT chk_ukm_status CHECK (status_keaktifan IN ('aktif','nonaktif')),
    tanggal_aktif    DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    tanggal_nonaktif DATE NULL,
    updated_at       DATETIME NULL,
    CONSTRAINT fk_ukm_anggota FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE CASCADE,
    CONSTRAINT uq_ukm_anggota_periode UNIQUE (anggota_id, periode)
);
GO

-- ============================================================
-- 5. PARTITUR TABLE (Music Scores)
-- ============================================================
CREATE TABLE partitur (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    judul         VARCHAR(150) NOT NULL,
    komposer      VARCHAR(100) NOT NULL,
    jumlah_suara  INT          NOT NULL,
    jenis_lagu    VARCHAR(50)  NOT NULL,
    file_pdf      VARCHAR(255) NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- 6. ACARA TABLE (Events)
-- ============================================================
CREATE TABLE acara (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    nama_acara        VARCHAR(150) NOT NULL,
    tanggal           DATE         NOT NULL,
    jenis_kegiatan    VARCHAR(50)  NOT NULL,
    lokasi            VARCHAR(150) NOT NULL,
    penyelenggara     VARCHAR(100) NOT NULL,
    penanggung_jawab  VARCHAR(100) NOT NULL,
    jenis_skkk        VARCHAR(50)  NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'aktif'
                      CONSTRAINT chk_acara_status CHECK (status IN ('aktif','selesai','dibatalkan')),
    created_at        DATETIME NOT NULL DEFAULT GETDATE(),
    created_by        INT NOT NULL,
    CONSTRAINT fk_acara_admin FOREIGN KEY (created_by) REFERENCES admin(id)
);
GO

-- ============================================================
-- 7. ACARA_PARTITUR TABLE (Event-Score Junction)
-- ============================================================
CREATE TABLE acara_partitur (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    acara_id    INT NOT NULL,
    partitur_id INT NOT NULL,
    CONSTRAINT uq_acara_partitur UNIQUE (acara_id, partitur_id),
    CONSTRAINT fk_ap_acara FOREIGN KEY (acara_id) REFERENCES acara(id) ON DELETE CASCADE,
    CONSTRAINT fk_ap_partitur FOREIGN KEY (partitur_id) REFERENCES partitur(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- 8. PESERTA_ACARA TABLE (Event Participants)
-- ============================================================
CREATE TABLE peserta_acara (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    status_peserta    VARCHAR(20) NULL,
    approval_status   VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    alasan_perubahan  VARCHAR(255) NULL,
    alasan_reject     VARCHAR(255) NULL,
    anggota_id        INT NOT NULL,
    acara_id          INT NOT NULL,
    approved_by       INT NOT NULL,
    created_at        DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uq_peserta UNIQUE (anggota_id, acara_id),
    CONSTRAINT chk_peserta_status CHECK (status_peserta IN ('ikut','batal')),
    CONSTRAINT chk_peserta_approval CHECK (approval_status IN ('menunggu','disetujui','ditolak')),
    CONSTRAINT fk_peserta_anggota FOREIGN KEY (anggota_id) REFERENCES anggota(id),
    CONSTRAINT fk_peserta_acara FOREIGN KEY (acara_id) REFERENCES acara(id),
    CONSTRAINT fk_peserta_admin FOREIGN KEY (approved_by) REFERENCES admin(id)
);
GO

-- ============================================================
-- 9. LATIHAN TABLE (Practice Sessions)
-- ============================================================
CREATE TABLE latihan (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    tanggal           DATE         NOT NULL,
    jam               VARCHAR(8)   NOT NULL,
    lokasi            VARCHAR(150) NOT NULL,
    keterangan        VARCHAR(255) NULL,
    tipe_latihan      VARCHAR(20)  NOT NULL
                      CONSTRAINT chk_latihan_tipe CHECK (tipe_latihan IN ('rutin','sekali')),
    waktu_notifikasi  INT NOT NULL DEFAULT 60,
    qr_token          VARCHAR(255) NULL,
    qr_expired_at     DATETIME NULL,
    created_by        INT NOT NULL,
    acara_id          INT NULL,
    CONSTRAINT fk_latihan_admin FOREIGN KEY (created_by) REFERENCES admin(id),
    CONSTRAINT fk_latihan_acara FOREIGN KEY (acara_id) REFERENCES acara(id)
);
GO

-- ============================================================
-- 10. ABSENSI TABLE (Attendance)
-- ============================================================
CREATE TABLE absensi (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    status        VARCHAR(20)  NOT NULL DEFAULT 'alpha'
                  CONSTRAINT chk_absensi_status CHECK (status IN ('hadir','alpha','izin','sakit')),
    waktu_checkin DATETIME NULL,
    qr_token      VARCHAR(255) NULL,
    latihan_id    INT NOT NULL,
    anggota_id    INT NOT NULL,
    CONSTRAINT uq_absensi UNIQUE (latihan_id, anggota_id),
    CONSTRAINT fk_absensi_latihan FOREIGN KEY (latihan_id) REFERENCES latihan(id) ON DELETE CASCADE,
    CONSTRAINT fk_absensi_anggota FOREIGN KEY (anggota_id) REFERENCES anggota(id)
);
GO

-- ============================================================
-- 11. DOKUMENTASI TABLE (Event Documentation)
-- ============================================================
CREATE TABLE dokumentasi (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    file_path   VARCHAR(255) NOT NULL,
    keterangan  VARCHAR(255) NULL,
    uploaded_at DATETIME NOT NULL DEFAULT GETDATE(),
    acara_id    INT NOT NULL,
    CONSTRAINT fk_dok_acara FOREIGN KEY (acara_id) REFERENCES acara(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- 12. NOTIFICATION TABLE (Push Notification History)
-- ============================================================
CREATE TABLE notification (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    judul       VARCHAR(150) NOT NULL,
    pesan       VARCHAR(500) NOT NULL,
    tipe        VARCHAR(30)  NOT NULL
                CONSTRAINT chk_notif_tipe CHECK (tipe IN ('reminder_latihan','info_acara','approval','umum')),
    is_read     BIT NOT NULL DEFAULT 0,
    anggota_id  INT NULL,
    acara_id    INT NULL,
    latihan_id  INT NULL,
    created_at  DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_notif_anggota FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_acara FOREIGN KEY (acara_id) REFERENCES acara(id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_latihan FOREIGN KEY (latihan_id) REFERENCES latihan(id) ON DELETE SET NULL
);
GO

-- ============================================================
-- INDEXES (Performance)
-- ============================================================
CREATE INDEX idx_anggota_suara ON anggota(bagian_suara);
CREATE INDEX idx_anggota_email ON anggota(email);
CREATE INDEX idx_ukm_anggota ON anggota_ukm(anggota_id);
CREATE INDEX idx_ukm_periode ON anggota_ukm(periode);
CREATE INDEX idx_ukm_status ON anggota_ukm(status_keaktifan);
CREATE INDEX idx_acara_status ON acara(status);
CREATE INDEX idx_acara_tanggal ON acara(tanggal);
CREATE INDEX idx_peserta_anggota ON peserta_acara(anggota_id);
CREATE INDEX idx_peserta_acara ON peserta_acara(acara_id);
CREATE INDEX idx_peserta_approval ON peserta_acara(approval_status);
CREATE INDEX idx_latihan_acara ON latihan(acara_id);
CREATE INDEX idx_latihan_tanggal ON latihan(tanggal);
CREATE INDEX idx_latihan_tipe ON latihan(tipe_latihan);
CREATE INDEX idx_absensi_latihan ON absensi(latihan_id);
CREATE INDEX idx_absensi_anggota ON absensi(anggota_id);
CREATE INDEX idx_dok_acara ON dokumentasi(acara_id);
CREATE INDEX idx_notif_anggota ON notification(anggota_id);
CREATE INDEX idx_notif_read ON notification(is_read);
CREATE INDEX idx_notif_created ON notification(created_at DESC);
GO

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admins (password: Admin123! — bcrypt 12 rounds)
INSERT INTO admin (nama, email, password, role) VALUES
('Super Admin', 'superadmin@pcu.ac.id', '$2a$12$TSYI7ZHSuVS50o2PptetZuOLVjVF5uKwEwO3ZKA55z3.mmB9MhDpG', 'super_admin'),
('Admin Choir', 'admin@pcu.ac.id', '$2a$12$TSYI7ZHSuVS50o2PptetZuOLVjVF5uKwEwO3ZKA55z3.mmB9MhDpG', 'admin');

-- Settings
INSERT INTO settings (setting_key, setting_value) VALUES ('active_periode', '2025/2026');
-- 'ukm_acara_id' is inserted further below, right after the "UKM" acara row is created.

-- Anggota / Members (password: Member123! — bcrypt 12 rounds)
INSERT INTO anggota (nrp, nama_lengkap, bagian_suara, alamat, kontak, email, password) VALUES
('C14230001', 'Maria Theresia', 'sopran', 'Jl. Siwalankerto 121, Surabaya', '081234567890', 'maria@student.pcu.ac.id', '$2a$12$Y8mqyU18nFtk3af8jyr7kuqru1Jr7FXl0ModwTacJy/ercjMtLjVe'),
('C14230002', 'Johanes Pratama', 'tenor', 'Jl. Rungkut Asri 45, Surabaya', '081234567891', 'johanes@student.pcu.ac.id', '$2a$12$Y8mqyU18nFtk3af8jyr7kuqru1Jr7FXl0ModwTacJy/ercjMtLjVe'),
('C14230003', 'Stefani Wijaya', 'alto', 'Jl. Mulyosari 78, Surabaya', '081234567892', 'stefani@student.pcu.ac.id', '$2a$12$Y8mqyU18nFtk3af8jyr7kuqru1Jr7FXl0ModwTacJy/ercjMtLjVe'),
('C14230004', 'Michael Santoso', 'bass', 'Jl. Kertajaya 200, Surabaya', '081234567893', 'michael@student.pcu.ac.id', '$2a$12$Y8mqyU18nFtk3af8jyr7kuqru1Jr7FXl0ModwTacJy/ercjMtLjVe'),
('C14230005', 'Angela Kusuma', 'sopran', 'Jl. Dharmahusada 55, Surabaya', '081234567894', 'angela@student.pcu.ac.id', '$2a$12$Y8mqyU18nFtk3af8jyr7kuqru1Jr7FXl0ModwTacJy/ercjMtLjVe'),
('C14230006', 'David Lim', 'tenor', 'Jl. Gubeng Kertajaya 10, Surabaya', '081234567895', 'david@student.pcu.ac.id', '$2a$12$Y8mqyU18nFtk3af8jyr7kuqru1Jr7FXl0ModwTacJy/ercjMtLjVe');

-- Anggota UKM registrations
INSERT INTO anggota_ukm (anggota_id, periode, status_keaktifan) VALUES
(1, '2025/2026', 'aktif'),
(2, '2025/2026', 'aktif'),
(3, '2025/2026', 'aktif'),
(4, '2025/2026', 'aktif'),
(5, '2025/2026', 'aktif'),
(6, '2025/2026', 'aktif');

-- Partitur (Music Scores)
INSERT INTO partitur (judul, komposer, jumlah_suara, jenis_lagu, file_pdf) VALUES
('Amazing Grace', 'John Newton', 4, 'Hymn', 'partitur/1775469596816.pdf'),
('Ave Maria', 'Franz Schubert', 4, 'Klasik', 'partitur/1775641496430.pdf'),
('Koor Hallelujah', 'G.F. Handel', 4, 'Oratorio', 'partitur/1776149496895.pdf');

-- Acara (Events)
-- "UKM" is the fixed, always-present event that every "Latihan UKM" (tipe_latihan='rutin') is tied to.
INSERT INTO acara (nama_acara, tanggal, jenis_kegiatan, lokasi, penyelenggara, penanggung_jawab, jenis_skkk, status, created_by) VALUES
('UKM', GETDATE(), 'UKM', 'EH.405', 'UKM Paduan Suara PCU', 'Ketua UKM', 'Bakat & Minat', 'aktif', 1),
('Konser Natal 2025', '2025-12-20', 'Konser', 'Aula Universitas Kristen Petra', 'UKM Paduan Suara PCU', 'Dr. Maria Susanti', 'Kegiatan Minat & Bakat', 'aktif', 1),
('Lomba Paduan Suara Regional', '2025-10-15', 'Lomba', 'Gedung Kesenian Surabaya', 'Pemerintah Kota Surabaya', 'Prof. Budi Hartono', 'Kegiatan Minat & Bakat', 'aktif', 1);

-- Point the settings key at the "UKM" acara row created above
INSERT INTO settings (setting_key, setting_value) VALUES ('ukm_acara_id', (SELECT CAST(id AS VARCHAR(10)) FROM acara WHERE nama_acara = 'UKM'));

-- Link partitur to events
INSERT INTO acara_partitur (acara_id, partitur_id) VALUES
(2, 1), (2, 3), (3, 2);

-- Peserta Acara (Event Participants)
INSERT INTO peserta_acara (anggota_id, acara_id, status_peserta, approval_status, approved_by) VALUES
(1, 2, 'ikut', 'disetujui', 1),
(2, 2, 'ikut', 'disetujui', 1),
(3, 2, 'ikut', 'disetujui', 1),
(4, 2, 'ikut', 'menunggu', 1),
(5, 3, 'ikut', 'disetujui', 1),
(6, 3, 'ikut', 'disetujui', 1);

-- Latihan (Practice Sessions)
-- 'rutin' (Latihan UKM) sessions are always tied to the "UKM" acara (id 1); 'sekali' (Latihan Acara) sessions point at any other acara.
INSERT INTO latihan (tanggal, jam, lokasi, keterangan, tipe_latihan, created_by, acara_id) VALUES
('2025-12-01', '16:00', 'Ruang Musik Lt. 3', 'Latihan materi Amazing Grace', 'sekali', 1, 2),
('2025-12-08', '16:00', 'Ruang Musik Lt. 3', 'Latihan materi Hallelujah', 'sekali', 1, 2),
('2025-10-01', '15:00', 'Ruang Musik Lt. 3', 'Latihan persiapan lomba', 'sekali', 1, 3),
('2025-09-15', '16:00', 'Ruang Musik Lt. 3', 'Latihan vokal rutin mingguan', 'rutin', 1, 1);

-- Sample Absensi
INSERT INTO absensi (status, waktu_checkin, latihan_id, anggota_id) VALUES
('hadir', '2025-12-01 16:05:00', 1, 1),
('hadir', '2025-12-01 16:02:00', 1, 2),
('izin', NULL, 1, 3),
('hadir', '2025-12-08 16:01:00', 2, 1),
('hadir', '2025-12-08 16:03:00', 2, 2),
('hadir', '2025-12-08 16:10:00', 2, 3);

-- Sample Notification
INSERT INTO notification (judul, pesan, tipe, anggota_id, acara_id) VALUES
('Pendaftaran Disetujui', 'Pendaftaran Anda untuk Konser Natal 2025 telah disetujui.', 'approval', 1, 1),
('Pendaftaran Disetujui', 'Pendaftaran Anda untuk Konser Natal 2025 telah disetujui.', 'approval', 2, 1);

PRINT 'Database initialized successfully!';
GO
