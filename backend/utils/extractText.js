const fs      = require('fs');
const path    = require('path');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const { extractTextFromImage } = require('./ocrService');
const { normalizeChatContent } = require('./chatParser');
const { simpleParser }         = require('mailparser');
const officeParser             = require('officeparser');

/**
 * Extracts plain text from a file based on its extension.
 *
 * @param {string} filePath  - Absolute path to the uploaded file
 * @param {string} fileType  - MIME type of the file
 * @returns {Promise<string>} - Extracted plain text
 */
async function extractText(filePath, fileType) {
  const ext = path.extname(filePath).toLowerCase();

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (fileType === 'application/pdf' || ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data   = await pdfParse(buffer);
    return data.text.trim();
  }

  // ── DOCX ───────────────────────────────────────────────────────────────────
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  }

  // ── PPTX ───────────────────────────────────────────────────────────────────
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    ext === '.pptx'
  ) {
    const text = await officeParser.parseOfficeAsync(filePath);
    return text.trim();
  }

  // ── TXT & JSON ─────────────────────────────────────────────────────────────
  if (fileType === 'text/plain' || ext === '.txt' || fileType === 'application/json' || ext === '.json') {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    return normalizeChatContent(rawContent);
  }

  // ── IMAGES (OCR) ───────────────────────────────────────────────────────────
  if (
    fileType === 'image/png' || ext === '.png' ||
    fileType === 'image/jpeg' || ext === '.jpg' || ext === '.jpeg'
  ) {
    const { extractedText } = await extractTextFromImage(filePath);
    return extractedText;
  }

  // ── EMAIL (.eml) ───────────────────────────────────────────────────────────
  if (fileType === 'message/rfc822' || ext === '.eml') {
    const rawContent = fs.readFileSync(filePath);
    const parsed = await simpleParser(rawContent);
    const fromStr = parsed.from ? parsed.from.text : 'Unknown';
    const subject = parsed.subject || 'No Subject';
    const body = parsed.text || '';
    return `Subject: ${subject}\nFrom: ${fromStr}\n\n${body}`.trim();
  }

  throw new Error(`Unsupported file type: ${fileType || ext}`);
}

module.exports = { extractText };
