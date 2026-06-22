/**
 * Express Application Setup
 * PCU Choir Management System API v2.0
 */
require('./config/env'); // Validate env vars first
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const anggotaRoutes = require('./modules/anggota/anggota.routes');
const anggotaUkmRoutes = require('./modules/anggota_ukm/anggota_ukm.routes');
const acaraRoutes = require('./modules/acara/acara.routes');
const pesertaRoutes = require('./modules/peserta_acara/peserta_acara.routes');
const partiturRoutes = require('./modules/partitur/partitur.routes');
const latihanRoutes = require('./modules/latihan/latihan.routes');
const absensiRoutes = require('./modules/absensi/absensi.routes');
const dokumentasiRoutes = require('./modules/dokumentasi/dokumentasi.routes');
const skkkRoutes = require('./modules/skkk/skkk.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const { settingsRouter, adminRouter } = require('./modules/admin_settings');

const app = express();
const config = require('./config/env');

// ── Security Middleware ──────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded files
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// ── Logging ─────────────────────────────────────────────
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// ── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files (uploaded files) ───────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health Check ─────────────────────────────────────────
app.get(['/health', '/healthz'], (req, res) => {
  res.json({ success: true, message: 'PCU Choir API is running.', version: '2.0.0', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/anggota', anggotaRoutes);
app.use('/api/anggota-ukm', anggotaUkmRoutes);
app.use('/api/acara', acaraRoutes);
app.use('/api/peserta-acara', pesertaRoutes);
app.use('/api/partitur', partiturRoutes);
app.use('/api/latihan', latihanRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/dokumentasi', dokumentasiRoutes);
app.use('/api/skkk', skkkRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);

// ── Error Handling ───────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
