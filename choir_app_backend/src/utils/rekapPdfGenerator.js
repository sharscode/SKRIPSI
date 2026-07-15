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
  // VOICE PART DISTRIBUTION SUMMARY
  // ==========================================
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.dark).text('Distribusi Anggota per Suara');
  doc.moveDown(0.5);

  const vc = data.voiceCounts;
  const voiceParts = [
    { label: 'Sopran', count: vc.sopran, color: COLORS.sopran },
    { label: 'Alto', count: vc.alto, color: COLORS.alto },
    { label: 'Tenor', count: vc.tenor, color: COLORS.tenor },
    { label: 'Bass', count: vc.bass, color: COLORS.bass },
  ];

  // Draw voice count boxes
  const boxStartX = 50;
  const boxWidth = 95;
  const boxHeight = 40;
  const boxGap = 12;
  const boxY = doc.y;

  voiceParts.forEach((vp, i) => {
    const x = boxStartX + i * (boxWidth + boxGap);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 4).fill(COLORS.subtleBg);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 4).lineWidth(0.75).stroke(vp.color);

    doc.fontSize(8).font('Helvetica-Bold').fillColor(vp.color)
      .text(vp.label.toUpperCase(), x, boxY + 6, { width: boxWidth, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.dark)
      .text(String(vp.count), x, boxY + 20, { width: boxWidth, align: 'center' });
  });

  // Total box
  const totalX = boxStartX + 4 * (boxWidth + boxGap);
  doc.roundedRect(totalX, boxY, boxWidth, boxHeight, 4).fill(COLORS.navy);

  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white)
    .text('TOTAL', totalX, boxY + 6, { width: boxWidth, align: 'center' });
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.white)
    .text(String(vc.total), totalX, boxY + 20, { width: boxWidth, align: 'center' });

  doc.y = boxY + boxHeight + 20;

  // ==========================================
  // PARTICIPANT TABLE
  // ==========================================
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.dark).text('Daftar Anggota Peserta');
  doc.moveDown(0.5);

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
      cellX += colWidths[i];
    });

    doc.moveTo(50, rowY + 13).lineTo(545, rowY + 13).lineWidth(0.5).stroke(COLORS.rowLine);
    rowY += 17;
  });

  // ==========================================
  // PARTITUR LIST
  // ==========================================
  // Check if we need a new page
  if (rowY > 620) {
    doc.addPage();
    rowY = 50;
  } else {
    doc.y = rowY + 15;
  }

  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.dark).text('Partitur Lagu yang Digunakan');
  doc.moveDown(0.5);

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
  }

  doc.end();
  return doc;
}

module.exports = { generateRekapPdf };
