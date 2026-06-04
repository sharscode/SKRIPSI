# ============================================================
# PCU Choir — Automated Database Setup Script
# Run ONCE after SQL Server Express is installed.
# ============================================================
#
# Prerequisites:
#   - SQL Server Express / Developer installed and running
#   - Run this script as Administrator
#
# Usage:
#   Right-click → Run with PowerShell (as Admin)
#   OR: powershell -ExecutionPolicy Bypass -File setup_database.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  PCU Choir — Database Setup" -ForegroundColor Cyan  
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Find SQL Server instance ─────────────────────
Write-Host "[1/5] Mencari SQL Server instance..." -ForegroundColor Yellow

$sqlcmdPath = $null
$possiblePaths = @(
    "C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\160\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\150\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\110\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\120\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\130\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\140\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\150\Tools\Binn\sqlcmd.exe",
    "C:\Program Files\Microsoft SQL Server\160\Tools\Binn\sqlcmd.exe"
)

foreach ($p in $possiblePaths) {
    if (Test-Path $p) { $sqlcmdPath = $p; break }
}

# Also try PATH
if (-not $sqlcmdPath) {
    try {
        $sqlcmdPath = (Get-Command sqlcmd -ErrorAction SilentlyContinue).Source
    } catch {}
}

if (-not $sqlcmdPath) {
    Write-Host "ERROR: sqlcmd tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pastikan SQL Server sudah terinstall." -ForegroundColor Yellow
    Write-Host "Download: https://www.microsoft.com/en-us/sql-server/sql-server-downloads" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

Write-Host "  OK: sqlcmd ditemukan di: $sqlcmdPath" -ForegroundColor Green

# ── Step 2: Test connection ───────────────────────────────
Write-Host "[2/5] Menguji koneksi ke SQL Server..." -ForegroundColor Yellow

$serverNames = @("localhost\SQLEXPRESS", "localhost", ".\SQLEXPRESS", ".")

$connServer = $null
foreach ($srv in $serverNames) {
    $result = & $sqlcmdPath -S $srv -Q "SELECT 1" -l 3 2>&1
    if ($LASTEXITCODE -eq 0) {
        $connServer = $srv
        break
    }
}

if (-not $connServer) {
    Write-Host "ERROR: Tidak bisa terhubung ke SQL Server!" -ForegroundColor Red
    Write-Host "Pastikan SQL Server Service sudah berjalan (cek Services.msc)" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

Write-Host "  OK: Terhubung ke server: $connServer" -ForegroundColor Green

# ── Step 3: Create database & user ───────────────────────
Write-Host "[3/5] Membuat database dan user..." -ForegroundColor Yellow

$setupSql = @"
-- Create database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'choir_app')
BEGIN
    CREATE DATABASE choir_app;
    PRINT 'Database choir_app berhasil dibuat.';
END
ELSE
BEGIN
    PRINT 'Database choir_app sudah ada.';
END
GO

USE choir_app;
GO

-- Create login & user
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'choir_user')
BEGIN
    CREATE LOGIN choir_user WITH PASSWORD = 'Choir123!', DEFAULT_DATABASE = choir_app;
    PRINT 'Login choir_user berhasil dibuat.';
END
GO

USE choir_app;
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'choir_user')
BEGIN
    CREATE USER choir_user FOR LOGIN choir_user;
    EXEC sp_addrolemember 'db_owner', 'choir_user';
    PRINT 'User choir_user berhasil dibuat dan diberi hak db_owner.';
END
GO

PRINT 'Setup database selesai!';
GO
"@

$setupSql | & $sqlcmdPath -S $connServer -E

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gagal membuat database/user!" -ForegroundColor Red
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

Write-Host "  OK: Database dan user berhasil dibuat." -ForegroundColor Green

# ── Step 4: Run init.sql ─────────────────────────────────
Write-Host "[4/5] Menjalankan init.sql (buat tabel + seed data)..." -ForegroundColor Yellow

$initSqlPath = Join-Path $PSScriptRoot "database\init.sql"

if (-not (Test-Path $initSqlPath)) {
    Write-Host "ERROR: File $initSqlPath tidak ditemukan!" -ForegroundColor Red
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

& $sqlcmdPath -S $connServer -d choir_app -U choir_user -P "Choir123!" -i $initSqlPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gagal menjalankan init.sql!" -ForegroundColor Red
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

Write-Host "  OK: Tabel dan seed data berhasil dibuat." -ForegroundColor Green

# ── Step 5: Update .env ──────────────────────────────────
Write-Host "[5/5] Mengupdate file .env..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot ".env"
$envContent = @"
PORT=3000
NODE_ENV=development
DB_SERVER=$connServer
DB_DATABASE=choir_app
DB_USER=choir_user
DB_PASSWORD=Choir123!
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=pcu_choir_jwt_secret_2025_very_long_and_secure
JWT_REFRESH_SECRET=pcu_choir_refresh_secret_2025_very_long_and_secure
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_EXPIRY=30d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE_MB=10
"@

$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host "  OK: .env berhasil diperbarui dengan server: $connServer" -ForegroundColor Green

# ── Done! ────────────────────────────────────────────────
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  SETUP SELESAI!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database    : choir_app" -ForegroundColor White
Write-Host "Server      : $connServer" -ForegroundColor White
Write-Host "User        : choir_user" -ForegroundColor White
Write-Host "Password    : Choir123!" -ForegroundColor White
Write-Host ""
Write-Host "Kredensial Login Admin:" -ForegroundColor Cyan
Write-Host "  Email    : admin@pcu.ac.id" -ForegroundColor White
Write-Host "  Password : Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "  Email    : superadmin@pcu.ac.id" -ForegroundColor White
Write-Host "  Password : Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "Langkah selanjutnya:" -ForegroundColor Cyan
Write-Host "  1. Buka terminal di folder choir_app_backend" -ForegroundColor White
Write-Host "  2. Jalankan: node src/server.js" -ForegroundColor White
Write-Host "  3. Buka http://localhost:5173 dan login!" -ForegroundColor White
Write-Host ""
Read-Host "Tekan Enter untuk keluar"
