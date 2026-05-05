const express    = require('express');
const router     = express.Router();
const db         = require('../config/db');
const { parseText, generateTags } = require('../utils/buildDraft');

// ── DB helpers ────────────────────────────────────────────────────────────────
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
// POST /api/draft
//
// Creates a Draft KnowledgeArticle from an uploaded file's extracted text.
//
// Body (JSON):
//   sourceFileId  {number}  required — ID from POST /api/upload response
//   createdBy     {string}  optional — who is creating the draft
//   overrides     {object}  optional — manually override title/summary/content/tags
//
// Flow:
//   1. Load extractedText from SourceFile
//   2. Parse into { title, summary, content }
//   3. Auto-generate tags
//   4. INSERT into KnowledgeArticle (status = 'Draft')
//   5. UPDATE SourceFile.articleId to link the two records
//   6. Log creation in ArticleHistory
//   7. Return the full article + parsed fields
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { sourceFileId, createdBy = 'system', overrides = {} } = req.body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!sourceFileId) {
      return res.status(400).json({
        success: false,
        error: 'sourceFileId is required. Call POST /api/upload first.',
      });
    }

    // ── Load the source file ──────────────────────────────────────────────────
    const sourceFile = await dbGet(
      'SELECT * FROM SourceFile WHERE id = ?',
      [sourceFileId]
    );

    if (!sourceFile) {
      return res.status(404).json({
        success: false,
        error: `SourceFile with id=${sourceFileId} not found.`,
      });
    }

    if (!sourceFile.extractedText || sourceFile.extractedText.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'SourceFile has no extractedText. Re-upload the file.',
      });
    }

    // ── Parse extracted text ──────────────────────────────────────────────────
    const parsed = parseText(sourceFile.extractedText);
    const tags   = generateTags(sourceFile.extractedText);

    // Allow caller to override any parsed field
    const title   = (overrides.title   || parsed.title).trim();
    const summary = (overrides.summary || parsed.summary).trim();
    const content = (overrides.content || parsed.content).trim();
    const finalTags = overrides.tags || tags;

    // ── Insert KnowledgeArticle ───────────────────────────────────────────────
    const insertResult = await dbRun(
      `INSERT INTO KnowledgeArticle
         (title, summary, content, tags, status, sourceFileName, createdBy)
       VALUES (?, ?, ?, ?, 'Draft', ?, ?)`,
      [title, summary, content, finalTags, sourceFile.fileName, createdBy]
    );

    const articleId = insertResult.lastID;

    // ── Link SourceFile → KnowledgeArticle ───────────────────────────────────
    await dbRun(
      'UPDATE SourceFile SET articleId = ? WHERE id = ?',
      [articleId, sourceFileId]
    );

    // ── Log creation in ArticleHistory ────────────────────────────────────────
    await dbRun(
      `INSERT INTO ArticleHistory (articleId, action, oldStatus, newStatus, editedBy, remarks)
       VALUES (?, 'created', NULL, 'Draft', ?, 'Auto-draft from uploaded file')`,
      [articleId, createdBy]
    );

    // ── Fetch and return the full created article ─────────────────────────────
    const article = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [articleId]
    );

    res.status(201).json({
      success: true,
      message: 'Draft article created successfully',
      data: {
        article,
        parsedFields: {
          title:   parsed.title,
          summary: parsed.summary,
          content: parsed.content,
          tags,
        },
        sourceFile: {
          id:       sourceFile.id,
          fileName: sourceFile.fileName,
          fileType: sourceFile.fileType,
        },
      },
    });

  } catch (err) {
    console.error('POST /api/draft error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/draft/from-text
//
// Creates a Draft directly from raw text (no file upload needed).
// Useful for RPA or manual input.
//
// Body (JSON):
//   text       {string}  required — raw text to parse
//   createdBy  {string}  optional
//   fileName   {string}  optional — label for the source
// ─────────────────────────────────────────────────────────────────────────────
router.post('/from-text', async (req, res) => {
  try {
    const { text, createdBy = 'system', fileName = 'manual-input' } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, error: 'text is required' });
    }

    const parsed = parseText(text);
    const tags   = generateTags(text);

    // Save raw text as a SourceFile record (no actual file on disk)
    const sfResult = await dbRun(
      `INSERT INTO SourceFile (fileName, fileType, extractedText)
       VALUES (?, 'text/plain', ?)`,
      [fileName, text]
    );
    const sourceFileId = sfResult.lastID;

    // Insert KnowledgeArticle
    const artResult = await dbRun(
      `INSERT INTO KnowledgeArticle
         (title, summary, content, tags, status, sourceFileName, createdBy)
       VALUES (?, ?, ?, ?, 'Draft', ?, ?)`,
      [parsed.title, parsed.summary, parsed.content, tags, fileName, createdBy]
    );
    const articleId = artResult.lastID;

    // Link SourceFile → article
    await dbRun(
      'UPDATE SourceFile SET articleId = ? WHERE id = ?',
      [articleId, sourceFileId]
    );

    // Log history
    await dbRun(
      `INSERT INTO ArticleHistory (articleId, action, oldStatus, newStatus, editedBy, remarks)
       VALUES (?, 'created', NULL, 'Draft', ?, 'Auto-draft from raw text')`,
      [articleId, createdBy]
    );

    const article = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [articleId]
    );

    res.status(201).json({
      success: true,
      message: 'Draft created from raw text',
      data: { article, parsedFields: { ...parsed, tags } },
    });

  } catch (err) {
    console.error('POST /api/draft/from-text error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
