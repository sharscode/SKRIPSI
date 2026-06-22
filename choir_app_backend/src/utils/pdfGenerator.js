/**
 * SKKK PDF Generator
 * Generates Surat Keterangan Kegiatan Kemahasiswaan PDF for events.
 * Redesigned with premium academic aesthetics, structured metadata cards, and official signature layouts.
 */
const PDFDocument = require('pdfkit');

/**
 * Generate SKKK PDF document.
 * @param {Object} data - Event data with participants and attendance
 * @param {Object} data.event - Event details
 * @param {Array} data.participants - Approved participants with attendance stats
 * @returns {PDFDocument} PDF document stream
 */
function generateSkkkPdf(data) {
  // Create PDF with standard margins
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const event = data.event;

  // --- Academic Kop Surat (Letterhead) ---
  doc.fontSize(16).font('Helvetica-Bold')
    .fillColor('#1E3A8A') // Premium Deep Navy
    .text('UNIVERSITAS KRISTEN PETRA', { align: 'center' });
  
  doc.fontSize(11).font('Helvetica')
    .fillColor('#475569') // Slate Gray
    .text('UKM Paduan Suara', { align: 'center' });
  
  doc.moveDown(0.4);

  // Dual Letterhead Rules (Thick and Thin)
  const currentY = doc.y;
  doc.moveTo(50, currentY).lineTo(545, currentY).lineWidth(2).stroke('#1E3A8A');
  doc.moveTo(50, currentY + 3).lineTo(545, currentY + 3).lineWidth(0.75).stroke('#B45309'); // Amber accent line
  doc.moveDown(1.2);

  // --- Official Document Title ---
  doc.fontSize(13).font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('Satuan Kredit Kegiatan Kemahasiswaan', { align: 'center' });
  
  doc.moveDown(1.2);

  // --- Metadata Card Container ---
  const infoItems = [
    ['Nama Kegiatan', event.nama_acara],
    ['Tanggal Pelaksanaan', event.tanggal],
    ['Lokasi', event.lokasi],
    ['Jenis SKKK', event.jenis_skkk],
  ];

  const cardTop = doc.y;
  const cardHeight = 78;

  // Draw Card Background and Border
  doc.roundedRect(50, cardTop - 8, 495, cardHeight, 6).fill('#F8FAFC');
  doc.roundedRect(50, cardTop - 8, 495, cardHeight, 6).lineWidth(0.75).stroke('#E2E8F0');

  // Draw Aligned Metadata Fields
  let itemY = cardTop;
  infoItems.forEach(([label, value]) => {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text(label, 70, itemY);
    doc.fontSize(9).font('Helvetica').fillColor('#0F172A').text(`:  ${value || '-'}`, 195, itemY);
    itemY += 16;
  });

  doc.y = cardTop + cardHeight + 15;

  // --- Participants Section ---
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text('Daftar Peserta');
  doc.moveDown(0.5);

  // Table Configuration (No, Nama Lengkap, NRP)
  const colWidths = [40, 275, 180];
  const colAligns = ['center', 'left', 'left'];
  const headers = ['No', 'Nama Lengkap', 'NRP'];

  // Table Header Drawing Helper
  function drawTableHeader(yPos) {
    doc.rect(50, yPos - 3, 495, 18).fill('#1E3A8A');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
    let headerX = 50;
    headers.forEach((header, i) => {
      doc.text(header, headerX, yPos, { width: colWidths[i], align: colAligns[i] });
      headerX += colWidths[i];
    });
    doc.fillColor('#000000');
  }

  // Draw First Page Header
  let tableTop = doc.y;
  drawTableHeader(tableTop);

  // Draw Rows
  let rowY = tableTop + 20;
  doc.fontSize(8.5).font('Helvetica');

  data.participants.forEach((p, index) => {
    // Add page break if rows overflow page boundaries
    if (rowY > 700) {
      doc.addPage();
      rowY = 50;
      drawTableHeader(rowY);
      rowY += 20;
      doc.fontSize(8.5).font('Helvetica');
    }

    // Alternating background rows for high readability
    if (index % 2 === 0) {
      doc.rect(50, rowY - 3, 495, 16).fill('#F8FAFC');
      doc.fillColor('#0F172A');
    } else {
      doc.fillColor('#0F172A');
    }

    // Row cell text data (No, Nama Lengkap, NRP)
    const rowData = [
      String(index + 1),
      p.nama_lengkap || '-',
      p.nrp || '-',
    ];

    let cellX = 50;
    rowData.forEach((text, i) => {
      doc.text(text, cellX, rowY, { width: colWidths[i], align: colAligns[i] });
      cellX += colWidths[i];
    });

    // Draw a subtle border line below row
    doc.moveTo(50, rowY + 13).lineTo(545, rowY + 13).lineWidth(0.5).stroke('#F1F5F9');

    rowY += 17;
  });



  doc.end();
  return doc;
}

module.exports = { generateSkkkPdf };
