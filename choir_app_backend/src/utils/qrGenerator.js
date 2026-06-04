/**
 * QR Code Generator Utility
 * Generates QR code data URLs for attendance scanning.
 */
const QRCode = require('qrcode');

/**
 * Generate a QR code data URL from a payload.
 * @param {Object} payload - Data to encode in the QR code
 * @returns {Promise<string>} Base64 data URL of the QR image
 */
async function generateQRDataURL(payload) {
  const jsonString = JSON.stringify(payload);
  const dataURL = await QRCode.toDataURL(jsonString, {
    width: 400,
    margin: 2,
    color: { dark: '#1A2F50', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });
  return dataURL;
}

module.exports = { generateQRDataURL };
