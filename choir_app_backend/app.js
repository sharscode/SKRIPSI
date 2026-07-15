require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { getPool } = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ===== Import Routes =====
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const anggotaRoutes = require('./modules/anggota/anggota.routes');
const anggotaUkmRoutes = require('./modules/anggota_ukm/anggota_ukm.routes');
const acaraRoutes = require('./modules/acara/acara.routes');
const pesertaAcaraRoutes = require('./modules/peserta_acara/peserta_acara.routes');
const partiturRoutes = require('./modules/partitur/partitur.routes');
const latihanRoutes = require('./modules/latihan/latihan.routes');
const absensiRoutes = require('./modules/absensi/absensi.routes');
// const skkkRoutes = require('./modules/skkk/skkk.routes');
const rekapRoutes = require('./modules/rekap/rekap.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Security Middleware =====
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },

    // 🔥 INI KUNCI UTAMA
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  next();
});

// ===== CORS =====
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || '').split(',')
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ===== Body Parser =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== Logger =====
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ===== Static Files (uploads) =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Health Check =====
app.get('/health', async (req, res) => {
  try {
    await getPool();
    res.json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
    });
  }
});

// ===== API Routes =====
const API = '/api';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/anggota`, anggotaRoutes);
app.use(`${API}/anggota_ukm`, anggotaUkmRoutes);
app.use(`${API}/acara`, acaraRoutes);
app.use(`${API}/peserta_acara`, pesertaAcaraRoutes);
app.use(`${API}/partitur`, partiturRoutes);
app.use(`${API}/latihan`, latihanRoutes);
app.use(`${API}/absensi`, absensiRoutes);
// app.use(`${API}/skkk`, skkkRoutes);
app.use(`${API}/rekap`, rekapRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// ===== 404 Handler =====
app.use(notFoundHandler);

// ===== Global Error Handler (harus paling akhir) =====
app.use(errorHandler);

// ===== Start Server =====
const startServer = async () => {
  try {
    console.log('⏳ Menghubungkan ke database SQL Server...');
    await getPool();
    console.log('✅ Database SQL Server terhubung!');

    app.listen(PORT, () => {
      console.log('');
      console.log('🎵 ================================');
      console.log(`🎵  CHOIR APP BACKEND`);
      console.log(`🎵  Running on port ${PORT}`);
      console.log(`🎵  ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log('🎵 ================================');
      console.log('');
      console.log(`📡 API Base URL : http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check : http://localhost:${PORT}/health`);
      console.log('');
    });
  } catch (err) {
    console.error('❌ Gagal terhubung ke database:', err.message);
    console.error('   Pastikan SQL Server berjalan dan konfigurasi .env sudah benar.');
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Server sedang dimatikan...');
  const { closePool } = require('./config/db');
  await closePool();
  console.log('✅ Koneksi database ditutup.');
  process.exit(0);
});

startServer();

module.exports = app;
