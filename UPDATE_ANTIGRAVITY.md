# 🔄 Panduan Update — untuk Agent Antigravity Sharon

> **Ini panduan UPDATE, bukan pemasangan baru.**
> Kalau proyek ini belum pernah jalan di mesin ini, pakai
> [`INSTRUCTIONS_FOR_ANTIGRAVITY.md`](INSTRUCTIONS_FOR_ANTIGRAVITY.md) dulu, bukan berkas ini.

Halo agent. Sharon sudah punya versi lama proyek ini berjalan di mesinnya. Tugasmu:
menarik versi terbaru, menjalankan migrasi database, lalu menyalakan ulang ketiga
aplikasi. Ikuti langkahnya berurutan dan laporkan hasil setiap langkah ke Sharon.

---

## 🚨 SATU HAL YANG TIDAK BOLEH DILAKUKAN

**JANGAN menjalankan `database/init.sql`.**

Berkas itu membuat skema dari nol beserta data contoh. Menjalankannya di database Sharon
yang sudah berisi data akan **menghapus atau menggandakan** anggota, acara, latihan, dan
absensi yang sudah ada. Untuk update, yang dipakai **hanya** berkas di
`database/migrations/`.

(Dan seperti biasa: `choir_app_backend/init.sql` di root backend itu skrip v1 yang basi —
jangan pernah dipakai. Yang sah ada di `choir_app_backend/database/init.sql`.)

---

## Langkah 1 — Tarik versi terbaru

```bash
git status
```

Kalau ada perubahan lokal milik Sharon, **tanyakan dulu** ke dia mau disimpan
(`git stash`) atau dibuang. Jangan putuskan sendiri. Setelah bersih:

```bash
git pull origin main
```

Tidak ada perubahan `package.json` maupun `pubspec.yaml` di update ini, jadi
`npm install` dan `flutter pub get` **tidak wajib**. Menjalankannya juga tidak merusak.

---

## Langkah 2 — Jalankan migrasi database

Jalankan **semua** berkas di `choir_app_backend/database/migrations/` menurut **urutan
nama berkas**. Urutan alfabetis itu memang urutan ketergantungan yang benar, jadi tidak
perlu daftar khusus.

Kenapa semuanya, bukan cuma yang baru: belum ada pencatat migrasi di proyek ini, jadi
tidak ada cara memastikan mana yang sudah pernah jalan di mesin Sharon. Semua migrasi
dibuat idempoten — sudah diuji dijalankan ulang pada database yang sudah termigrasi, dan
hasilnya **nol perubahan data**. Jadi menjalankan semuanya itu aman dan menutup celah.

Kalau `sqlcmd` tersedia:

```bash
cd choir_app_backend
for f in database/migrations/*.sql; do
  echo "===== $f"
  sqlcmd -S 127.0.0.1,1433 -d choir_app -U choir_user -P "Choir123!" -C -N o -b -i "$f" \
    || { echo ">>> BERHENTI: gagal di $f"; break; }
done
```

Arti flag-nya, supaya tidak dihapus tanpa sengaja:

* `-b` — berhenti dengan kode error kalau ada kegagalan. Tanpa ini sqlcmd tetap keluar
  dengan sukses meski skripnya error, jadi kegagalan lolos tanpa terlihat.
* `-C -N o` — `-C` mempercayai sertifikat server, `-N o` membuat enkripsi **opsional**.
  ODBC Driver 18 memaksa enkripsi secara bawaan, dan pada instance yang tidak
  menyiapkan TLS koneksinya akan ditolak dengan
  *"Encryption not supported on SQL Server"*. `-C` sendirian **tidak** cukup.
* Jangan pipe hasilnya ke `grep`/`head` di dalam loop — exit code sqlcmd akan tertutup
  dan `break` tidak pernah jalan.

> Sesuaikan `-S`, `-U`, `-P` dengan pengaturan SQL Server Sharon (lihat
> `choir_app_backend/.env`). Kalau instance-nya pakai Windows Authentication, ganti
> `-U ... -P ...` dengan `-E`. Pada sebagian build sqlcmd, `-E` **tidak bisa** dipakai
> bersama `-i`; kalau muncul *"The -E and the -U/-P options are mutually exclusive"*,
> pakai redirect input: `sqlcmd -S ... -E -d choir_app -C -N o -b < "$f"`.

Kalau tidak ada `sqlcmd`, minta Sharon membuka **SSMS** atau **Azure Data Studio**,
menyambung ke database `choir_app`, lalu membuka dan menjalankan (F5) setiap berkas
migrasi satu per satu **urut nama**.

**Yang harus dilihat:** setiap berkas selesai tanpa error. Pesan seperti
`Kolom ... sudah ada, dilewati.` itu **normal** — artinya migrasi itu sudah pernah jalan.
Kalau muncul baris `PERHATIAN:`, laporkan isinya ke Sharon: itu penanda ada data di luar
kosakata resmi BAKA yang perlu dia periksa sendiri.

Setelah selesai, pastikan tujuh kolom formulir sudah terbentuk:

```sql
SELECT COUNT(*) AS harus_7
FROM sys.columns c JOIN sys.tables t ON t.object_id = c.object_id
WHERE (t.name = 'acara' AND c.name IN ('jenis_kepanitiaan','lingkup','lembaga','jabatan_default'))
   OR (t.name = 'peserta_acara' AND c.name IN ('jabatan','bidang','divisi'));
```

Hasilnya harus **7**. Kalau kurang, ada migrasi yang belum jalan — jangan lanjut.

---

## Langkah 3 — Nyalakan ulang backend

Backend memuat kode saat start dan **tidak** memuat ulang otomatis, jadi wajib
dimatikan lalu dinyalakan lagi. Kalau tidak, semua perubahan hari ini tidak akan terasa.

```bash
cd choir_app_backend
node src/server.js
```

**Yang harus dilihat di log:**

```
✅ Connected to SQL Server: choir_app
   Periode berjalan: 2026/2027
🎵 PCU Choir API v2.0 running
   Port: 3000
```

---

## Langkah 4 — Admin web

```bash
cd choir_app_admin
npm run dev
```

Kalau Vite sudah jalan, cukup muat ulang halaman di browser — tapi kalau ragu, matikan
dan nyalakan ulang saja.

---

## Langkah 5 — Aplikasi anggota (Flutter)

Ada dua berkas Dart yang berubah, jadi aplikasinya perlu dibangun ulang (hot restart
juga cukup kalau sedang berjalan):

```bash
cd choir_app_anggota
flutter run -d windows
```

---

## ✅ Cara memastikan update-nya berhasil

Minta Sharon mengecek tiga hal ini. Kalau ketiganya benar, update sukses.

**1. Form acara punya bagian baru**
Admin web → **Acara** → **Edit** salah satu acara → gulir ke bawah. Harus ada bagian
**FORMULIR SKKK BAKA** dengan empat field terisi: Jenis Kepanitiaan
(`Kurang dari 1 tahun`), Lingkup (`Universitas`), Lembaga (`UP Lainnya`), dan Jabatan
Peserta (`ANGGOTA UKM`).

Dropdown **Jenis SKKK** di atasnya juga harus **terisi**, tidak kosong. Kalau kosong,
migrasi Langkah 2 belum jalan sepenuhnya.

**2. PDF SKKK berbentuk formulir resmi BAKA**
Admin web → **SKKK** → pilih acara → **Download**. PDF-nya sekarang harus berupa
*Formulir Permohonan SKKK Online*: ada kop dengan `No. Dokumen F01-PM05-BAKA-UKP`,
enam field kegiatan (NAMA KEGIATAN, JENIS KEPANITIAAN, LINGKUP, PERIODE, LOGDATE,
LEMBAGA), tabel enam kolom (NO/NRP/NAMA/JABATAN/BIDANG/DIVISI), lalu pernyataan
pemeriksaan dan dua blok tanda tangan (Ketua UA/UP dan Ketua Panitia).

Kalau PDF-nya masih berupa tabel biru dengan judul "Satuan Kredit Kegiatan
Kemahasiswaan", berarti backend belum dinyalakan ulang — kembali ke Langkah 3.

**3. Anggota bisa melihat kelayakan SKKK-nya**
Aplikasi anggota → login sebagai anggota → **Riwayat Absensi**. Harus ada kartu
kelayakan SKKK per acara, bukan cuma persentase gabungan.

---

## 📋 Yang berubah di update ini

Untuk Sharon, supaya tahu apa yang dicari:

| Perubahan | Di mana terasa |
| :--- | :--- |
| Cetak SKKK mengikuti formulir resmi BAKA (F01-PM05-BAKA-UKP) | Halaman SKKK → Download |
| Empat field kepala formulir + jabatan/bidang/divisi per peserta | Form Acara, bagian "Formulir SKKK BAKA" |
| Istilah Jenis SKKK / Kepanitiaan / Lingkup / Jabatan disamakan dengan sistem BAKA | Dropdown di form Acara |
| Peserta di formulir diurutkan menurut NRP, seperti formulir BAKA | PDF SKKK |
| Anggota bisa melihat kelayakan SKKK-nya sendiri per acara | Aplikasi anggota → Riwayat Absensi |
| Perbaikan: data contoh dulu memakai istilah Jenis SKKK yang tidak ada di pilihan, jadi field-nya tampil kosong saat diedit | Form Acara |

Persentase kehadiran **sengaja tidak dicetak** di PDF — formulir resmi BAKA tidak
memuatnya. Penyaringan kehadiran tetap dikerjakan di dalam aplikasi.

---

## 📌 Dua hal yang masih menunggu dari Sharon

Keduanya **tidak menghalangi** — formulir sudah tercetak lengkap tanpa ini.

1. **Logo Petra.** Sel logo di kop formulir sekarang kosong. Begitu Sharon punya
   berkasnya, simpan sebagai `choir_app_backend/src/assets/logo-petra.png` dan logonya
   langsung terpakai — tidak perlu ubah kode.
2. **Nilai LEMBAGA untuk Paduan Suara.** Sekarang memakai `UP Lainnya`, nilai yang
   muncul di contoh formulir BAKA. Di form entry BAKA field ini bernama
   *Unit Akademik/Pendukung*. Kalau BAKA memberi nilai khusus untuk PS, ubah di
   database, satu baris:

   ```sql
   UPDATE settings SET setting_value = '<nilai dari BAKA>', updated_at = GETDATE()
   WHERE setting_key = 'skkk_lembaga';
   ```

---

## 🔑 Kredensial uji

| Peran | Email | Password |
| :--- | :--- | :--- |
| Super Admin | `superadmin@pcu.ac.id` | `Admin123!` |
| Anggota | `angela@student.pcu.ac.id` | `Member123!` |
