/**
 * Rekap Kegiatan PDF Generator
 * Generates a comprehensive Activity Summary Report PDF with:
 * - Event details (metadata card)
 * - Voice part distribution summary
 * - Participant roster grouped by voice part
 * - Partitur (music scores) list
 * - Total latihan count
 */
const PDFDocument = require('pdfkit');

// Color palette (consistent with SKKK PDF)
const COLORS = {
  navy: '#1E3A8A',
  slate: '#475569',
  dark: '#0F172A',
  subtleBg: '#F8FAFC',
  border: '#E2E8F0',
  amber: '#B45309',
  white: '#FFFFFF',
  rowLine: '#F1F5F9',
  sopran: '#7C3AED',  // purple
  alto: '#2563EB',    // blue
  tenor: '#059669',   // green
  bass: '#DC2626',    // red
};

/**
 * Generate Rekap Kegiatan PDF document.
 * @param {Object} data - Rekap data from service
 * @returns {PDFDocument} PDF document stream
 */
function generateRekapPdf(data) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const event = data.event;

  // ==========================================
  // LETTERHEAD
  // ==========================================
  doc.fontSize(16).font('Helvetica-Bold')
    .fillColor(COLORS.navy)
    .text('UNIVERSITAS KRISTEN PETRA', { align: 'center' });

  doc.fontSize(11).font('Helvetica')
    .fillColor(COLORS.slate)
    .text('UKM Paduan Suara', { align: 'center' });

  doc.moveDown(0.4);

  const ruleY = doc.y;
  doc.moveTo(50, ruleY).lineTo(545, ruleY).lineWidth(2).stroke(COLORS.navy);
  doc.moveTo(50, ruleY + 3).lineTo(545, ruleY + 3).lineWidth(0.75).stroke(COLORS.amber);
  doc.moveDown(1.2);

  // ==========================================
  // DOCUMENT TITLE
  // ==========================================
  doc.fontSize(13).font('Helvetica-Bold')
    .fillColor(COLORS.dark)
    .text('Laporan Rekap Kegiatan', { align: 'center' });

  doc.moveDown(1.2);

  // ==========================================
  // METADATA CARD
  // ==========================================
  const infoItems = [
    ['Nama Kegiatan', event.nama_acara],
    ['Tanggal Pelaksanaan', event.tanggal],
    ['Lokasi', event.lokasi],
    ['Penyelenggara', event.penyelenggara],
    ['Penanggung Jawab', event.penanggung_jawab],
    ['Jenis SKKK', event.jenis_skkk],
    ['Total Latihan', `${data.totalLatihan} kali`],
  ];

  const cardTop = doc.y;
  const cardHeight = infoItems.length * 16 + 14;

  doc.roundedRect(50, cardTop - 8, 495, cardHeight, 6).fill(COLORS.subtleBg);
  doc.roundedRect(50, cardTop - 8, 495, cardHeight, 6).lineWidth(0.75).stroke(COLORS.border);

  let itemY = cardTop;
  infoItems.forEach(([label, value]) => {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.slate).text(label, 70, itemY);
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(`:  ${value || '-'}`, 200, itemY);
    itemY += 16;
  });

  doc.y = cardTop + cardHeight + 15;

  // ==========================================
  // VOICE PART DISTRIBUTION SUMMARY (TABLE)
  // ==========================================
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.dark).text('Distribusi Anggota per Suara', 50);
  doc.moveDown(0.6);

  const vc = data.voiceCounts;
  const distHeaders = ['Bagian Suara', 'Jumlah Anggota'];
  const distColWidths = [150, 100];
  const distColAligns = ['left', 'center'];

  let distTableTop = doc.y;
  
  // Draw header
  doc.rect(50, distTableTop - 3, 250, 18).fill(COLORS.navy);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5);
  doc.text(distHeaders[0], 60, distTableTop, { width: distColWidths[0], align: distColAligns[0] });
  doc.text(distHeaders[1], 50 + distColWidths[0], distTableTop, { width: distColWidths[1], align: distColAligns[1] });
  
  let distRowY = distTableTop + 20;
  doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.dark);

  const distRows = [
    ['Sopran', String(vc.sopran)],
    ['Alto', String(vc.alto)],
    ['Tenor', String(vc.tenor)],
    ['Bass', String(vc.bass)],
    ['Total', String(vc.total)]
  ];

  distRows.forEach((row, index) => {
    if (index === 4) {
      // Highlight Total row slightly
      doc.rect(50, distRowY - 3, 250, 16).fill('#E2E8F0');
      doc.fillColor(COLORS.dark).font('Helvetica-Bold');
    } else if (index % 2 === 0) {
      doc.rect(50, distRowY - 3, 250, 16).fill(COLORS.subtleBg);
      doc.fillColor(COLORS.dark).font('Helvetica');
    } else {
      doc.fillColor(COLORS.dark).font('Helvetica');
    }

    doc.text(row[0], 60, distRowY, { width: distColWidths[0], align: distColAligns[0] });
    doc.text(row[1], 50 + distColWidths[0], distRowY, { width: distColWidths[1], align: distColAligns[1] });
    doc.moveTo(50, distRowY + 13).lineTo(300, distRowY + 13).lineWidth(0.5).stroke(COLORS.rowLine);
    distRowY += 17;
  });

  doc.y = distRowY + 20; // jarak antar bagian, disamakan

  // ==========================================
  // PARTICIPANT TABLE
  // ==========================================
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.dark).text('Daftar Anggota', 50);
  doc.moveDown(0.6);

  const colWidths = [35, 85, 200, 90];
  const colAligns = ['center', 'left', 'left', 'center'];
  const headers = ['No', 'NRP', 'Nama Lengkap', 'Bagian Suara'];

  function drawTableHeader(yPos) {
    doc.rect(50, yPos - 3, 495, 18).fill(COLORS.navy);
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5);
    let headerX = 50;
    headers.forEach((header, i) => {
      doc.text(header, headerX, yPos, { width: colWidths[i], align: colAligns[i] });
      headerX += colWidths[i];
    });
    doc.fillColor('#000000');
  }

  let tableTop = doc.y;
  drawTableHeader(tableTop);

  let rowY = tableTop + 20;
  doc.fontSize(8.5).font('Helvetica');

  data.participants.forEach((p, index) => {
    if (rowY > 700) {
      doc.addPage();
      rowY = 50;
      drawTableHeader(rowY);
      rowY += 20;
      doc.fontSize(8.5).font('Helvetica');
    }

    if (index % 2 === 0) {
      doc.rect(50, rowY - 3, 495, 16).fill(COLORS.subtleBg);
      doc.fillColor(COLORS.dark);
    } else {
      doc.fillColor(COLORS.dark);
    }

    const suaraLabel = p.bagian_suara
      ? p.bagian_suara.charAt(0).toUpperCase() + p.bagian_suara.slice(1)
      : '-';

    const rowData = [
      String(index + 1),
      p.nrp || '-',
      p.nama_lengkap || '-',
      suaraLabel,
    ];

    let cellX = 50;
    rowData.forEach((text, i) => {
      doc.text(text, cellX, rowY, { width: colWidths[i], align: colAligns[i] });
      cellX += cellX < 50 ? 0 : colWidths[i]; // safe text offset addition
    });

    // Let's rewrite text render loop more reliably with absolute positioning
    doc.text(rowData[0], 50, rowY, { width: colWidths[0], align: colAligns[0] });
    doc.text(rowData[1], 50 + colWidths[0], rowY, { width: colWidths[1], align: colAligns[1] });
    doc.text(rowData[2], 50 + colWidths[0] + colWidths[1], rowY, { width: colWidths[2], align: colAligns[2] });
    doc.text(rowData[3], 50 + colWidths[0] + colWidths[1] + colWidths[2], rowY, { width: colWidths[3], align: colAligns[3] });

    doc.moveTo(50, rowY + 13).lineTo(545, rowY + 13).lineWidth(0.5).stroke(COLORS.rowLine);
    rowY += 17;
  });

  // Sync flow position with the row height
  doc.y = rowY;

  // ==========================================
  // PARTITUR LIST
  // ==========================================
  // Check if we need a new page
  if (doc.y > 600) {
    doc.addPage();
    doc.y = 50;
  } else {
    doc.y = doc.y + 20; // jarak antar bagian, disamakan dengan bagian lain
  }

  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.dark).text('Daftar Partitur', 50);
  doc.moveDown(0.6);

  if (data.partiturList.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.slate)
      .text('Belum ada partitur yang dikaitkan dengan kegiatan ini.', { oblique: true });
  } else {
    const pColWidths = [35, 250, 210];
    const pColAligns = ['center', 'left', 'left'];
    const pHeaders = ['No', 'Judul Lagu', 'Komposer / Arranger'];

    function drawPartiturHeader(yPos) {
      doc.rect(50, yPos - 3, 495, 18).fill(COLORS.navy);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5);
      let hx = 50;
      pHeaders.forEach((header, i) => {
        doc.text(header, hx, yPos, { width: pColWidths[i], align: pColAligns[i] });
        hx += pColWidths[i];
      });
      doc.fillColor('#000000');
    }

    let pTableTop = doc.y;
    drawPartiturHeader(pTableTop);

    let pRowY = pTableTop + 20;
    doc.fontSize(8.5).font('Helvetica');

    data.partiturList.forEach((pt, index) => {
      if (pRowY > 700) {
        doc.addPage();
        pRowY = 50;
        drawPartiturHeader(pRowY);
        pRowY += 20;
        doc.fontSize(8.5).font('Helvetica');
      }

      if (index % 2 === 0) {
        doc.rect(50, pRowY - 3, 495, 16).fill(COLORS.subtleBg);
        doc.fillColor(COLORS.dark);
      } else {
        doc.fillColor(COLORS.dark);
      }

      const pRowData = [
        String(index + 1),
        pt.judul || '-',
        pt.komposer || '-',
      ];

      let cx = 50;
      pRowData.forEach((text, i) => {
        doc.text(text, cx, pRowY, { width: pColWidths[i], align: pColAligns[i] });
        cx += pColWidths[i];
      });

      doc.moveTo(50, pRowY + 13).lineTo(545, pRowY + 13).lineWidth(0.5).stroke(COLORS.rowLine);
      pRowY += 17;
    });

    // Kembalikan posisi alir ke bawah baris terakhir. Tabel ini digambar dengan
    // koordinat absolut (pRowY), jadi tanpa langkah ini doc.y masih tertinggal di
    // header dan bagian berikutnya akan menimpa tabel.
    doc.y = pRowY;
  }

  // ==========================================
  // EVALUASI KEGIATAN (hanya bila admin sudah mengisinya)
  // ==========================================
  if (data.evaluasi) {
    const ev = data.evaluasi;

    // Jangan tinggalkan judul sendirian di kaki halaman.
    if (doc.y > 640) {
      doc.addPage();
      doc.y = 50;
    } else {
      doc.y = doc.y + 20;
    }

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.dark)
      .text('Evaluasi Kegiatan', 50);
    doc.moveDown(0.6);

    if (ev.skor) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.navy)
        .text(`Penilaian: ${ev.skor} dari 5`, 50);
      doc.moveDown(0.4);
    }

    [
      ['Catatan', ev.catatan],
      ['Kendala', ev.kendala],
      ['Saran Perbaikan', ev.saran],
    ].forEach(([label, value]) => {
      if (!value) return;
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }
      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.slate).text(label, 50);
      doc.moveDown(0.25);
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark)
        .text(value, 50, doc.y, { width: 495, align: 'justify' });
      doc.moveDown(0.8);
    });
  }

  doc.end();
  return doc;
}

module.exports = { generateRekapPdf };
