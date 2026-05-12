const express      = require('express');
const router       = express.Router();
const path         = require('path');
const db           = require('../config/db');
const { upload }   = require('../config/upload');
const { extractText } = require('../utils/extractText');

// Promise wrapper for db.run
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    })
  );

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload
// Accepts a single file (field name: "file").
// Extracts text, saves a SourceFile record, and returns the result.
// Does NOT create a KnowledgeArticle here — that is Phase 4.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', upload.single('file'), async (req, res) => {
  // Multer error (wrong file type, size limit, etc.)
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded. Ensure type is PDF, DOCX, PPTX, TXT, JSON, EML, PNG, JPG.',
    });
  }

  const { originalname, mimetype, path: filePath, filename, size } = req.file;

  try {
    // 1. Extract text from the uploaded file
    const extractedText = await extractText(filePath, mimetype);

    // 2. Save file metadata + extracted text to SourceFile table
    const result = await dbRun(
      `INSERT INTO SourceFile (fileName, fileType, filePath, extractedText)
       VALUES (?, ?, ?, ?)`,
      [originalname, mimetype, filePath, extractedText]
    );

    const sourceFile = await dbGet(
      'SELECT * FROM SourceFile WHERE id = ?',
      [result.lastID]
    );

    // 3. Respond with everything the client needs to build a draft (Phase 4)
    res.status(201).json({
      success: true,
      message: 'File uploaded and text extracted successfully',
      data: {
        sourceFileId:  sourceFile.id,
        fileName:      sourceFile.fileName,
        fileType:      sourceFile.fileType,
        fileSizeBytes: size,
        extractedText: sourceFile.extractedText,
        uploadedAt:    sourceFile.uploadedAt,
      },
    });
  } catch (err) {
    console.error('POST /api/upload error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Multer error handler (file type / size rejections)
// ─────────────────────────────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: 'File too large. Max 10 MB allowed.' });
  }
  res.status(400).json({ success: false, error: err.message });
});

module.exports = router;
