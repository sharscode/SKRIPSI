/**
 * SKKK PDF Generator
 *
 * Mencetak Formulir Permohonan SKKK Online mengikuti formulir resmi BAKA
 * (No. Dokumen F01-PM05-BAKA-UKP, revisi 00, berlaku 19-02-2018): kepala
 * dokumen, enam field kegiatan, tabel NO/NRP/NAMA/JABATAN/BIDANG/DIVISI,
 * pernyataan pemeriksaan, dua blok tanda tangan, dan catatan LPPM.
 *
 * Formulir ini adalah dokumen yang diserahkan ke BAKA, jadi susunannya
 * mengikuti formulir apa adanya. Persentase kehadiran sengaja TIDAK dicetak:
 * formulir resmi tidak memuatnya. Penyaringan kehadiran adalah pekerjaan
 * aplikasi, bukan isi formulir.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { hitungPeriodeSkkk } = require('./periodeAkademik');

// ── Nilai tetap formulir ────────────────────────────────────
const NO_DOKUMEN = 'F01-PM05-BAKA-UKP';
const NO_REVISI = '00';
const TANGGAL_BERLAKU = '19-02-2018';

/**
 * Formulir resmi mencetak "1 dari 1" sebagai teks tetap, bukan nomor halaman
 * sebenarnya — pada contoh 3 halaman pun tetap tertulis "1 dari 1".
 * Dipertahankan apa adanya agar keluaran persis menyerupai formulir BAKA.
 * Ganti satu baris ini kalau nanti diminta penomoran yang sesungguhnya.
 */
const HALAMAN = '1 dari 1';

const JUDUL = 'FORMULIR – PERMOHONAN SKKK ONLINE';
const SUBJUDUL = 'BIRO ADMINISTRASI KEMAHASISWAAN DAN ALUMNI';
const PERNYATAAN =
  'Kami yang bertandatangan dibawah ini telah memeriksa dengan baik, penuh ' +
  'integritas dan bertanggungjawab atas pengajuan SKKK mahasiswa untuk kegiatan ' +
  'ini sesuai dengan aturan yang berlaku.';
const CATATAN =
  'Note : Untuk jenis kegiatan Mata Kuliah Service Learning, tidak perlu tanda ' +
  'tangan dari PIHAK LPPM';

// Logo lambang Petra pada kepala formulir. Belum tersedia di repo — selnya
// dibiarkan kosong sampai filenya ada, tanpa mengubah tata letak.
const BERKAS_LOGO = path.join(__dirname, '..', 'assets', 'logo-petra.png');

// ── Geometri ────────────────────────────────────────────────
const MARGIN = 40;
const LEBAR = 515; // 40 .. 555
const BATAS_BAWAH = 795; // baris tabel tidak melewati garis ini
const HITAM = '#000000';
const ABU = '#D9D9D9';

const PAD_X = 4;
const PAD_Y = 3;

// Kolom kepala dokumen (No. Dokumen / No. Revisi / Tanggal Berlaku / Halaman)
const KOL_KEPALA = [148, 108, 141, 118];
// Tabel peserta (NO / NRP / NAMA / JABATAN / BIDANG / DIVISI).
// NO, NRP, dan DIVISI isinya pendek dan seragam, jadi lebarnya tetap.
const KOL_NO = 28;
const KOL_NRP = 66;
const KOL_DIVISI = 46;
const BATAS_JABATAN = [68, 160]; // lebar minimum dan maksimum
const BATAS_BIDANG = [80, 120];
const JUDUL_KOLOM = ['NO', 'NRP', 'NAMA', 'JABATAN', 'BIDANG', 'DIVISI'];

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * LOGDATE dalam format yang dipakai formulir: 'May 8 2025 11:13AM'.
 * Itu keluaran konversi tanggal bawaan SQL Server pada sistem BAKA.
 */
function formatLogdate(tanggal) {
  const jam24 = tanggal.getHours();
  const jam12 = jam24 % 12 === 0 ? 12 : jam24 % 12;
  const menit = String(tanggal.getMinutes()).padStart(2, '0');
  return `${BULAN_SINGKAT[tanggal.getMonth()]} ${tanggal.getDate()} ${tanggal.getFullYear()} ` +
    `${jam12}:${menit}${jam24 < 12 ? 'AM' : 'PM'}`;
}

const total = (arr) => arr.reduce((a, b) => a + b, 0);

/** Bingkai ganda seperti pada formulir: garis luar tebal, garis dalam tipis. */
function bingkaiGanda(doc, x, y, w, h) {
  doc.lineWidth(0.9).rect(x, y, w, h).stroke(HITAM);
  doc.lineWidth(0.5).rect(x + 2, y + 2, w - 4, h - 4).stroke(HITAM);
}

/**
 * Satu baris tabel dengan tinggi mengikuti isi terpanjang dan teks rata
 * tengah secara vertikal (perilaku sel tabel pada formulir aslinya).
 * @returns {number} tinggi baris yang terpakai
 */
function gambarBaris(doc, x, y, kolom, isi, opsi = {}) {
  const { font = 'Times-Roman', fontSize = 10, bg = null, tinggiMin = 20 } = opsi;

  doc.font(font).fontSize(fontSize);
  const tinggiIsi = isi.map((teks, i) =>
    doc.heightOfString(String(teks ?? ''), { width: kolom[i] - 2 * PAD_X })
  );
  const tinggi = Math.max(tinggiMin, ...tinggiIsi.map((h) => h + 2 * PAD_Y));

  if (bg) doc.rect(x, y, total(kolom), tinggi).fill(bg);

  doc.fillColor(HITAM).font(font).fontSize(fontSize);
  let cx = x;
  isi.forEach((teks, i) => {
    doc.text(String(teks ?? ''), cx + PAD_X, y + (tinggi - tinggiIsi[i]) / 2, {
      width: kolom[i] - 2 * PAD_X,
      align: 'left',
    });
    cx += kolom[i];
  });

  return tinggi;
}

/**
 * Lebar kolom JABATAN dan BIDANG mengikuti isi terpanjangnya, seperti tabel
 * pada formulir aslinya yang melebar sesuai teks. Sisa ruang jatuh ke kolom
 * NAMA. Tanpa ini, jabatan panjang seperti 'PENGISI ACARA/PENGMAS 5ASPEK'
 * terpecah jadi empat baris dan menggelembungkan tinggi seluruh tabel.
 */
function hitungKolom(doc, peserta, event) {
  const sisa = LEBAR - KOL_NO - KOL_NRP - KOL_DIVISI;

  doc.font('Times-Roman').fontSize(10);
  const terlebar = (nilai) => Math.max(0, ...nilai.map((t) => doc.widthOfString(String(t || ''))));
  const jepit = (n, [min, max]) => Math.min(max, Math.max(min, Math.round(n)));

  const wJabatan = jepit(
    terlebar(peserta.map((p) => p.jabatan || event.jabatan_default)) + 2 * PAD_X,
    BATAS_JABATAN
  );
  const wBidang = jepit(
    terlebar(peserta.map((p) => p.bidang || event.jenis_skkk)) + 2 * PAD_X,
    BATAS_BIDANG
  );

  return [KOL_NO, KOL_NRP, sisa - wJabatan - wBidang, wJabatan, wBidang, KOL_DIVISI];
}

/** Garis pemisah sel: satu garis bawah dan garis vertikal antar kolom. */
function gambarGrid(doc, x, y, kolom, tinggi) {
  doc.lineWidth(0.5);
  doc.moveTo(x, y + tinggi).lineTo(x + total(kolom), y + tinggi).stroke(HITAM);
  let cx = x;
  doc.moveTo(cx, y).lineTo(cx, y + tinggi).stroke(HITAM);
  kolom.forEach((w) => {
    cx += w;
    doc.moveTo(cx, y).lineTo(cx, y + tinggi).stroke(HITAM);
  });
}

/** Kepala dokumen: sel logo, judul, subjudul, dan baris identitas formulir. */
function gambarKepala(doc) {
  const atas = MARGIN;
  const tinggiJudul = 22;
  const tinggiSub = 17;
  const tinggiLabel = 17;
  const tinggiNilai = 17;
  const lebarLogo = KOL_KEPALA[0];
  const lebarTeks = LEBAR - lebarLogo;

  let y = atas;

  // Baris judul + subjudul, dengan sel logo menyatu di sebelah kirinya.
  doc.rect(MARGIN + lebarLogo, y + tinggiJudul, lebarTeks, tinggiSub).fill(ABU);

  doc.fillColor(HITAM).font('Times-Bold').fontSize(12)
    .text(JUDUL, MARGIN + lebarLogo, y + 6, { width: lebarTeks, align: 'center' });
  doc.font('Times-Roman').fontSize(10.5)
    .text(SUBJUDUL, MARGIN + lebarLogo, y + tinggiJudul + 4, { width: lebarTeks, align: 'center' });

  if (fs.existsSync(BERKAS_LOGO)) {
    doc.image(BERKAS_LOGO, MARGIN + 8, y + 4, {
      fit: [lebarLogo - 16, tinggiJudul + tinggiSub - 8],
      align: 'center',
      valign: 'center',
    });
  }

  // Garis pemisah judul/subjudul dan garis kanan sel logo.
  doc.lineWidth(0.5);
  doc.moveTo(MARGIN + lebarLogo, y + tinggiJudul).lineTo(MARGIN + LEBAR, y + tinggiJudul).stroke(HITAM);
  doc.moveTo(MARGIN + lebarLogo, y).lineTo(MARGIN + lebarLogo, y + tinggiJudul + tinggiSub).stroke(HITAM);
  y += tinggiJudul + tinggiSub;

  // Baris label dan nilai identitas formulir, rata tengah seperti aslinya.
  const barisTengah = (isi, tinggi, font) => {
    doc.font(font).fontSize(10.5).fillColor(HITAM);
    let cx = MARGIN;
    isi.forEach((teks, i) => {
      const h = doc.heightOfString(String(teks), { width: KOL_KEPALA[i] - 2 * PAD_X });
      doc.text(String(teks), cx + PAD_X, y + (tinggi - h) / 2, {
        width: KOL_KEPALA[i] - 2 * PAD_X,
        align: 'center',
      });
      cx += KOL_KEPALA[i];
    });
    gambarGrid(doc, MARGIN, y, KOL_KEPALA, tinggi);
    y += tinggi;
  };

  barisTengah(['No. Dokumen', 'No. Revisi', 'Tanggal Berlaku', 'Halaman'], tinggiLabel, 'Times-Roman');
  barisTengah([NO_DOKUMEN, NO_REVISI, TANGGAL_BERLAKU, HALAMAN], tinggiNilai, 'Times-Roman');

  bingkaiGanda(doc, MARGIN, atas, LEBAR, y - atas);
  doc.y = y;
}

/** Enam field kegiatan: label tebal, titik dua sejajar, nilai di kanannya. */
function gambarFieldKegiatan(doc, field) {
  const xLabel = 158;
  const xTitikDua = 331;
  const xNilai = 343;
  const jarak = 20;

  let y = doc.y + 40;
  field.forEach(([label, nilai]) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(HITAM).text(label, xLabel, y);
    doc.font('Times-Roman').fontSize(11).text(':', xTitikDua, y - 1);
    doc.text(String(nilai ?? '-'), xNilai, y - 1, { width: MARGIN + LEBAR - xNilai, align: 'left' });
    y += jarak;
  });

  doc.y = y;
}

/**
 * Tabel peserta. Baris kepala hanya muncul di halaman pertama tabel, dan
 * halaman lanjutan langsung meneruskan barisnya — sama seperti formulir asli.
 */
function gambarTabelPeserta(doc, peserta, event) {
  const kolom = hitungKolom(doc, peserta, event);
  let y = doc.y + 28;
  let awalSegmen = y;

  const tutupSegmen = () => bingkaiGanda(doc, MARGIN, awalSegmen, LEBAR, y - awalSegmen);

  const tinggiKepala = gambarBaris(doc, MARGIN, y, kolom, JUDUL_KOLOM, {
    font: 'Times-Bold', fontSize: 10.5, bg: ABU, tinggiMin: 20,
  });
  gambarGrid(doc, MARGIN, y, kolom, tinggiKepala);
  y += tinggiKepala;

  peserta.forEach((p, i) => {
    const isi = [
      String(i + 1),
      p.nrp || '',
      (p.nama_lengkap || '').toUpperCase(),
      p.jabatan || event.jabatan_default || '',
      p.bidang || event.jenis_skkk || '',
      p.divisi || '',
    ];

    // Tinggi baris dihitung dulu supaya baris tidak terpotong di batas halaman.
    doc.font('Times-Roman').fontSize(10);
    const tinggiPerkiraan = Math.max(
      20,
      ...isi.map((teks, k) => doc.heightOfString(teks, { width: kolom[k] - 2 * PAD_X }) + 2 * PAD_Y)
    );

    if (y + tinggiPerkiraan > BATAS_BAWAH) {
      tutupSegmen();
      doc.addPage();
      y = MARGIN;
      awalSegmen = y;
    }

    const tinggi = gambarBaris(doc, MARGIN, y, kolom, isi, { font: 'Times-Roman', fontSize: 10 });
    gambarGrid(doc, MARGIN, y, kolom, tinggi);
    y += tinggi;
  });

  tutupSegmen();
  doc.y = y;
}

/** Pernyataan, dua blok tanda tangan, dan catatan LPPM. */
function gambarPenutup(doc) {
  const RUANG_DIBUTUHKAN = 250;
  if (doc.y + RUANG_DIBUTUHKAN > BATAS_BAWAH) {
    doc.addPage();
    doc.y = MARGIN;
  }

  doc.font('Times-Roman').fontSize(11).fillColor(HITAM)
    .text(PERNYATAAN, MARGIN, doc.y + 24, { width: LEBAR, align: 'justify' });

  const xKiri = MARGIN + 2;
  const kotakKanan = { x: MARGIN + 260, width: LEBAR - 260 };

  const barisTandaTangan = (kiri, kanan, jarakAtas) => {
    const y = doc.y + jarakAtas;
    doc.text(kiri, xKiri, y);
    doc.text(kanan, kotakKanan.x, y, { width: kotakKanan.width, align: 'right' });
    doc.y = y;
  };

  // Jarak antar baris diukur dari contoh formulir resmi.
  barisTandaTangan('Mengetahui,', 'Dengan Hormat,', 46);
  barisTandaTangan('Ketua UA/UP', 'Ketua Panitia', 68);
  barisTandaTangan('.....................', '.....................', 32);

  doc.font('Times-Bold').fontSize(11)
    .text(CATATAN, MARGIN, doc.y + 34, { width: LEBAR, align: 'left' });
}

/**
 * Generate SKKK PDF document.
 * @param {Object} data - Data acara beserta pesertanya
 * @param {Object} data.event - Detail acara
 * @param {Array} data.participants - Peserta yang sudah disetujui
 * @returns {PDFDocument} PDF document stream
 */
function generateSkkkPdf(data) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const event = data.event || {};
  const dicetakPada = new Date();

  doc.info.Title = `Permohonan SKKK - ${event.nama_acara || 'Kegiatan'}`;

  gambarKepala(doc);

  gambarFieldKegiatan(doc, [
    ['NAMA KEGIATAN', event.nama_acara],
    ['JENIS KEPANITIAAN', event.jenis_kepanitiaan],
    ['LINGKUP', event.lingkup],
    ['PERIODE', hitungPeriodeSkkk(dicetakPada)],
    ['LOGDATE', formatLogdate(dicetakPada)],
    ['LEMBAGA', event.lembaga],
  ]);

  gambarTabelPeserta(doc, data.participants || [], event);
  gambarPenutup(doc);

  doc.end();
  return doc;
}

module.exports = { generateSkkkPdf };
