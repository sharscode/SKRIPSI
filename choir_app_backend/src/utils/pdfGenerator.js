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
    .text('SURAT KETERANGAN KEGIATAN KEMAHASISWAAN', { align: 'center' });
  
  // Registration Document Numbering
  const yearOfEvent = event.tanggal ? new Date(event.tanggal).getFullYear() : new Date().getFullYear();
  doc.fontSize(9.5).font('Helvetica-Oblique')
    .fillColor('#64748B')
    .text(`No. Reg: SKKK/UKM-PS/${event.id || '00'}/${yearOfEvent}`, { align: 'center' });
  
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

  // --- Official Footer / Signature Block ---
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Ensure signature block is not orphaned on a separate page
  if (rowY > 640) {
    doc.addPage();
    rowY = 50;
  }

  const footerY = rowY + 25;
  doc.fillColor('#1E293B');
  doc.fontSize(9.5).font('Helvetica')
    .text(`Surabaya, ${today}`, 350, footerY, { width: 195, align: 'center' });
  
  doc.text('Mengetahui,', 350, footerY + 14, { width: 195, align: 'center' });
  doc.text('Penanggung Jawab Kegiatan', 350, footerY + 28, { width: 195, align: 'center' });

  // Elegant Signature Line Placeholder
  doc.moveTo(370, footerY + 82).lineTo(525, footerY + 82).lineWidth(0.75).stroke('#CBD5E1');

  doc.fontSize(9.5).font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text(event.penanggung_jawab || 'Penanggung Jawab', 350, footerY + 88, { width: 195, align: 'center' });
  
  doc.fontSize(8.5).font('Helvetica')
    .fillColor('#64748B')
    .text('UKM Paduan Suara', 350, footerY + 102, { width: 195, align: 'center' });

  doc.end();
  return doc;
}

module.exports = { generateSkkkPdf };
