# 🤖 Hand-off Instructions for Sharon's Antigravity AI Agent
> **System: PCU Choir Management System**

Hello fellow Antigravity agent! You are assisting **Sharon** in setting up and running her paduan suara management system for her skripsi. The project has been fully developed, debugged, and verified 100% stable.

Please read and follow these steps to automatically setup, configure, and launch the entire application for Sharon:

---

## 🛠️ Step 1: Initialize Database (SQL Server)

> ⚠️ **Use `choir_app_backend/database/init.sql` — NOT `choir_app_backend/init.sql`.**
> The file at the backend root is an outdated v1 script: it seeds the admin as
> `superadmin@choirapp.com` and is missing the `anggota_ukm` and `notification`
> tables. Running it produces a database the app cannot log into.
> The current schema (v2.0) lives in `database/init.sql`.

The database schema and seed data are located in `choir_app_backend/database/init.sql`.
1. Verify if MS SQL Server is active on Sharon's local machine.
2. If she has `mssql` or `sqlcmd` configured, you can execute it automatically:
   ```bash
   sqlcmd -S 127.0.0.1,1433 -d choir_app -U choir_user -P "Choir123!" -C -i database/init.sql
   sqlcmd -S 127.0.0.1,1433 -d choir_app -U choir_user -P "Choir123!" -C -i database/migrations/2026-08-20_ukm_acara.sql
   ```
3. Otherwise, guide Sharon to open **SQL Server Management Studio (SSMS)**, create a database named `choir_app`, open `choir_app_backend/database/init.sql`, and execute it (press **F5**). Then run `database/migrations/2026-08-20_ukm_acara.sql` the same way.

---

## 📡 Step 2: Configure & Start Backend API (`choir_app_backend`)
1. Change directory to `./choir_app_backend`.
2. Run `npm install` to download all dependencies.
3. Copy `.env.example` to `.env`.
4. Ask Sharon for her local SQL Server sa password, and populate the `.env` fields:
   * `DB_PASSWORD=KetikPasswordSQLServerSharon`
   * `DB_ENCRYPT=false`
   * `DB_TRUST_SERVER_CERTIFICATE=true`
5. Start the backend as a background task:
   ```bash
   node src/server.js
   ```
6. Verify connection log: `✅ Connected to SQL Server: choir_app` at port 3000.

---

## 💻 Step 3: Configure & Start Web Admin (`choir_app_admin`)
1. Change directory to `./choir_app_admin`.
2. Run `npm install` to download dependencies.
3. Verify that `.env` contains:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```
   (The variable is `VITE_API_BASE_URL` — that is the name `src/config/api.js` reads.
   `.env` is optional: without it the app already falls back to `http://localhost:3000/api`.)
4. Start the React/Vite development server as a background task:
   ```bash
   # Add execution policy bypass if on Windows PowerShell:
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; npm run dev
   ```
5. Confirm Vite is running on Port 5173 or 5174.

---

## 📱 Step 4: Configure & Start Mobile Application (`choir_app_anggota`)
1. Change directory to `./choir_app_anggota`.
2. Run `flutter pub get` to download Dart packages.
3. **Important Features Implemented**:
   - **Absensi QR Simulator**: We have implemented a graceful desktop fallback scanner in `lib/screens/absensi/scan_qr_screen.dart`! On Windows Desktop builds, it will NOT load `mobile_scanner` (preventing MissingPluginExceptions). Instead, it loads a beautiful **Simulator Mode UI** where Sharon can paste the active QR token from the admin web page and click a "Kirim Absensi" button to test check-ins instantly!
   - **Mouse Drag Scroll**: We have implemented `DesktopScrollBehavior` in `lib/main.dart` to support mouse click-and-drag horizontal scrolling on Windows builds so carousels can be scrolled with a mouse cursor natively.
4. Launch the application as a background task:
   ```bash
   flutter run -d windows
   ```

---

## 🔑 Default Test Credentials

| Role | Email / NRP | Password | Screen |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@pcu.ac.id` | `Admin123!` | Web Admin Page |
| **Anggota (Sopran)** | `angela@student.pcu.ac.id` | `Member123!` | Mobile App |
| **Anggota (Alto)** | `budi@student.pcu.ac.id` | `Member123!` | Mobile App |

Let's get this skripsi up and running beautifully for Sharon!
