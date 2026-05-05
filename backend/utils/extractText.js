const fs      = require('fs');
const path    = require('path');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');

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

  // ── TXT ────────────────────────────────────────────────────────────────────
  if (fileType === 'text/plain' || ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8').trim();
  }

  throw new Error(`Unsupported file type: ${fileType || ext}`);
}

module.exports = { extractText };
