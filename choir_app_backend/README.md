# 🎵 Choir App Backend

REST API backend untuk aplikasi Paduan Suara — dibangun dengan **Node.js + Express + SQL Server**.

---

## 📋 Prasyarat

- **Node.js** v18 atau lebih baru → [download](https://nodejs.org)
- **SQL Server** 2012 atau lebih baru (Express Edition sudah cukup)
- **npm** v8+

---

## 🚀 Cara Menjalankan

### 1. Clone / Ekstrak project

```bash
cd choir_app_backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
# Salin file contoh
cp .env.example .env

# Edit sesuai konfigurasi lokal kamu
notepad .env        # Windows
nano .env           # Linux/Mac
```

Isi minimal yang harus diubah di `.env`:
```env
DB_SERVER=localhost          # atau nama instance SQL Server kamu
DB_DATABASE=choir_app
DB_USER=sa                   # user SQL Server
DB_PASSWORD=password_kamu
JWT_SECRET=ganti_dengan_string_acak_min_32_karakter
JWT_REFRESH_SECRET=ganti_dengan_string_acak_lain_min_32_karakter
```

### 4. Inisialisasi database

Buka **SQL Server Management Studio (SSMS)** atau **sqlcmd**, lalu jalankan:

```sql
-- Di SSMS: File → Open → database/init.sql → Execute (F5)
```

Atau via command line:
```bash
sqlcmd -S localhost -U sa -P password_kamu -i database/init.sql
```

### 5. Jalankan server

```bash
# Development (auto-restart saat file berubah)
npm run dev

# Production
npm start
```

Server akan berjalan di: `http://localhost:3000`

---

## 🔑 Akun Default (Seed Data)

| Role        | Email                        | Password    |
|-------------|------------------------------|-------------|
| Super Admin | superadmin@choirapp.com      | `Admin123!` |
| Admin       | admin@choirapp.com           | `Admin123!` |
| Anggota     | budi@choirapp.com            | `Member123!`|

> ⚠️ **Penting:** Ganti semua password default setelah pertama kali login!

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api`

| Method | Endpoint                               | Deskripsi                        | Auth     |
|--------|----------------------------------------|----------------------------------|----------|
| GET    | `/health`                              | Health check server & DB         | -        |
| POST   | `/auth/login/admin`                    | Login admin                      | -        |
| POST   | `/auth/login/anggota`                  | Login anggota (mobile)           | -        |
| POST   | `/auth/refresh`                        | Refresh JWT token                | -        |
| GET    | `/auth/me`                             | Data user yang login             | ✅ Any   |
| GET    | `/admin`                               | Daftar admin                     | ✅ Admin |
| POST   | `/admin`                               | Tambah admin                     | ✅ Admin |
| GET    | `/anggota`                             | Daftar anggota (+ filter/search) | ✅ Admin |
| POST   | `/anggota`                             | Tambah anggota                   | ✅ Admin |
| PUT    | `/anggota/:id`                         | Update anggota                   | ✅ Admin |
| DELETE | `/anggota/:id`                         | Hapus anggota                    | ✅ Admin |
| GET    | `/acara`                               | Daftar acara                     | ✅ Admin |
| POST   | `/acara`                               | Buat acara                       | ✅ Admin |
| PATCH  | `/acara/:id/status`                    | Update status acara              | ✅ Admin |
| GET    | `/acara/:id/peserta`                   | Daftar peserta acara             | ✅ Admin |
| PATCH  | `/acara/:aId/peserta/:pId`             | Update status peserta            | ✅ Admin |
| GET    | `/acara/:id/dokumentasi`               | Daftar dokumentasi acara         | ✅ Admin |
| POST   | `/acara/:id/dokumentasi`               | Upload dokumentasi               | ✅ Admin |
| GET    | `/partitur`                            | Daftar partitur (+ filter)       | ✅ Admin |
| POST   | `/partitur`                            | Upload partitur PDF              | ✅ Admin |
| POST   | `/partitur/acara/:aId/assign`          | Assign partitur ke acara         | ✅ Admin |
| GET    | `/latihan`                             | Daftar latihan                   | ✅ Admin |
| POST   | `/latihan`                             | Buat latihan                     | ✅ Admin |
| GET    | `/latihan/:id/qrcode`                  | Generate QR Code absensi         | ✅ Admin |
| POST   | `/absensi/scan/:token`                 | Scan QR (mobile anggota)         | ✅ Anggota|
| GET    | `/absensi/latihan/:latihanId`          | Rekap absensi per latihan        | ✅ Admin |
| POST   | `/absensi/manual`                      | Input absensi manual             | ✅ Admin |
| GET    | `/skkk/:acaraId/generate`              | Download PDF SKKK                | ✅ Admin |

### Contoh Request Login Admin

```bash
curl -X POST http://localhost:3000/api/auth/login/admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@choirapp.com","password":"Admin123!"}'
```

### Contoh Request dengan Token

```bash
curl http://localhost:3000/api/anggota \
  -H "Authorization: Bearer <access_token>"
```

---

## 📁 Struktur Project

```
choir_app_backend/
├── database/
│   └── init.sql              # Script inisialisasi DB
├── src/
│   ├── app.js                # Entry point
│   ├── config/
│   │   └── db.js             # SQL Server connection pool
│   ├── middleware/
│   │   ├── auth.js           # JWT verify + role guard
│   │   ├── errorHandler.js   # Global error handler
│   │   └── upload.js         # Multer file upload
│   ├── modules/
│   │   ├── auth/             # Login, refresh token
│   │   ├── admin/            # Manajemen admin
│   │   ├── anggota/          # CRUD anggota
│   │   ├── acara/            # CRUD acara + peserta + dokumentasi
│   │   ├── partitur/         # CRUD partitur PDF
│   │   ├── latihan/          # CRUD latihan + QR Code
│   │   ├── absensi/          # Scan QR + rekap absensi
│   │   └── skkk/             # Generate PDF SKKK
│   └── utils/
│       ├── response.js       # Standar format response
│       └── qrGenerator.js   # QR Code generator
├── uploads/                  # File upload (auto-dibuat)
├── .env.example
├── .gitignore
└── package.json
```

---

## 🔒 Format Response API

Semua response menggunakan format standar:

```json
// Success
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Pesan error",
  "errors": [ ... ]  // opsional, untuk validasi
}
```

---

## ⚙️ Troubleshooting

**❌ Error: "Login failed for user 'sa'"**
→ Pastikan SQL Server Authentication Mode = "SQL Server and Windows Authentication"
→ Di SSMS: klik kanan server → Properties → Security → pilih "SQL Server and Windows Authentication mode"

**❌ Error: "Cannot connect to localhost"**
→ Pastikan SQL Server service berjalan
→ Pastikan TCP/IP enabled di SQL Server Configuration Manager

**❌ Error: "Named Pipes Provider"**
→ Tambahkan `DB_ENCRYPT=false` dan `DB_TRUST_SERVER_CERTIFICATE=true` di `.env`
