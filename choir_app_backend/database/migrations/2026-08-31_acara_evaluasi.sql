-- ============================================================
-- Migration: 2026-08-31_acara_evaluasi.sql
-- Description: Tabel evaluasi/penilaian kegiatan yang diisi admin
--              setelah acara berstatus 'selesai'.
-- ============================================================

USE choir_app;
GO

-- ── Langkah 1: Buat tabel acara_evaluasi ────────────────────
-- Sengaja tabel terpisah, bukan kolom tambahan di 'acara':
--   * evaluasi ditulis belakangan dan punya jejak sendiri (siapa & kapan)
--   * setiap query acara tidak ikut menyeret teks panjang yang jarang dipakai
-- UNIQUE(acara_id) menjaga satu evaluasi per acara.
IF OBJECT_ID('acara_evaluasi', 'U') IS NULL
BEGIN
    CREATE TABLE acara_evaluasi (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        acara_id    INT NOT NULL,
        skor        INT NULL
                    CONSTRAINT chk_eval_skor CHECK (skor BETWEEN 1 AND 5),
        catatan     VARCHAR(2000) NOT NULL,
        kendala     VARCHAR(1000) NULL,
        saran       VARCHAR(1000) NULL,
        -- Evaluasi internal sering memuat kritik. Default tertutup;
        -- admin membukanya ke anggota secara sengaja.
        is_publik   BIT NOT NULL DEFAULT 0,
        created_by  INT NOT NULL,
        created_at  DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at  DATETIME NULL,
        CONSTRAINT uq_evaluasi_acara UNIQUE (acara_id),
        CONSTRAINT fk_eval_acara FOREIGN KEY (acara_id)
            REFERENCES acara(id) ON DELETE CASCADE,
        CONSTRAINT fk_eval_admin FOREIGN KEY (created_by)
            REFERENCES admin(id)
    );
    PRINT 'Tabel acara_evaluasi berhasil dibuat.';
END
ELSE
BEGIN
    PRINT 'Tabel acara_evaluasi sudah ada, melewati langkah 1.';
END
GO

-- ── Langkah 2: Index untuk pencarian acara yang belum dievaluasi ──
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_evaluasi_acara')
BEGIN
    CREATE INDEX idx_evaluasi_acara ON acara_evaluasi(acara_id);
    PRINT 'Index idx_evaluasi_acara berhasil dibuat.';
END
GO

PRINT 'Migrasi acara_evaluasi selesai.';
GO
