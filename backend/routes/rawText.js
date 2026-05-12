const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { normalizeChatContent } = require('../utils/chatParser');

// Helper to run sqlite query as promise
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    })
  );

// POST /api/raw-text
router.post('/', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'rawText is required.'
      });
    }

    const textContent = normalizeChatContent(rawText);
    
    // Create a SourceFile record for the raw text so it can be passed to draft creation
    const sfResult = await dbRun(
      `INSERT INTO SourceFile (fileName, fileType, extractedText)
       VALUES (?, 'text/plain', ?)`,
      ['pasted_raw_text.txt', textContent]
    );
    const sourceFileId = sfResult.lastID;

    return res.json({
      success: true,
      message: 'Raw text processed successfully',
      data: {
        extractedText: textContent,
        sourceType: 'raw_text',
        sourceFileId: sourceFileId, // Include ID to work with existing Draft pipeline
        fileName: 'pasted_raw_text.txt',
        fileSizeBytes: Buffer.byteLength(textContent, 'utf8')
      }
    });
  } catch (error) {
    console.error('Error processing raw text:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
