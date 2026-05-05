const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ─── Helper ───────────────────────────────────────────────────────────────────
// Wraps db.run / db.get / db.all in Promises so we can use async/await cleanly.
const dbRun  = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // `this` has .lastID and .changes
    })
  );

const dbGet  = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

const dbAll  = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/articles
// Returns all articles. Supports optional ?search= and ?status= query params.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;

    let sql    = 'SELECT * FROM KnowledgeArticle WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY createdAt DESC';

    const articles = await dbAll(sql, params);
    res.json({ success: true, count: articles.length, data: articles });
  } catch (err) {
    console.error('GET /api/articles error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/articles/:id
// Returns a single article by ID.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const article = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.json({ success: true, data: article });
  } catch (err) {
    console.error('GET /api/articles/:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/articles
// Creates a new article. Status defaults to "Draft".
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      title,
      summary       = '',
      content       = '',
      tags          = '',
      status        = 'Draft',
      sourceFileName = '',
      createdBy     = 'system',
    } = req.body;

    // title is required
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    // Validate status value
    const validStatuses = ['Draft', 'Reviewed', 'Published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const result = await dbRun(
      `INSERT INTO KnowledgeArticle
        (title, summary, content, tags, status, sourceFileName, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), summary, content, tags, status, sourceFileName, createdBy]
    );

    const newArticle = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({ success: true, data: newArticle });
  } catch (err) {
    console.error('POST /api/articles error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/articles/:id
// Updates an existing article. Increments version on every save.
// Records the change in ArticleHistory.
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const existing = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const {
      title          = existing.title,
      summary        = existing.summary,
      content        = existing.content,
      tags           = existing.tags,
      status         = existing.status,
      sourceFileName = existing.sourceFileName,
      createdBy      = existing.createdBy,
      remarks        = '',
    } = req.body;

    const validStatuses = ['Draft', 'Reviewed', 'Published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const newVersion    = (existing.version || 1) + 1;
    const publishedAt   = status === 'Published'
      ? (existing.publishedAt || new Date().toISOString())
      : existing.publishedAt;

    await dbRun(
      `UPDATE KnowledgeArticle
       SET title = ?, summary = ?, content = ?, tags = ?, status = ?,
           sourceFileName = ?, updatedAt = CURRENT_TIMESTAMP,
           publishedAt = ?, version = ?
       WHERE id = ?`,
      [title, summary, content, tags, status, sourceFileName, publishedAt, newVersion, req.params.id]
    );

    // Log the update in ArticleHistory
    await dbRun(
      `INSERT INTO ArticleHistory (articleId, action, oldStatus, newStatus, editedBy, remarks)
       VALUES (?, 'updated', ?, ?, ?, ?)`,
      [req.params.id, existing.status, status, createdBy, remarks]
    );

    const updated = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('PUT /api/articles/:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/articles/:id
// Deletes an article by ID. History is cascade-deleted by the DB.
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const existing = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    await dbRun('DELETE FROM KnowledgeArticle WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: `Article "${existing.title}" (id: ${req.params.id}) deleted successfully`,
    });
  } catch (err) {
    console.error('DELETE /api/articles/:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/articles/:id/status
// Advances the workflow: Draft → Reviewed → Published.
// Only allows forward transitions. Records change in ArticleHistory.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const existing = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const { status, editedBy = 'system', remarks = '' } = req.body;

    const validStatuses = ['Draft', 'Reviewed', 'Published'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Enforce forward-only workflow transitions
    const flow = { Draft: 0, Reviewed: 1, Published: 2 };
    if (flow[status] <= flow[existing.status]) {
      return res.status(400).json({
        success: false,
        error: `Cannot move from "${existing.status}" to "${status}". Workflow is Draft → Reviewed → Published.`,
      });
    }

    const publishedAt = status === 'Published'
      ? (existing.publishedAt || new Date().toISOString())
      : existing.publishedAt;

    await dbRun(
      `UPDATE KnowledgeArticle
       SET status = ?, publishedAt = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, publishedAt, req.params.id]
    );

    // Log to ArticleHistory
    await dbRun(
      `INSERT INTO ArticleHistory (articleId, action, oldStatus, newStatus, editedBy, remarks)
       VALUES (?, 'status_change', ?, ?, ?, ?)`,
      [req.params.id, existing.status, status, editedBy, remarks]
    );

    const updated = await dbGet(
      'SELECT * FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: `Status changed: ${existing.status} → ${status}`,
      data: updated,
    });
  } catch (err) {
    console.error('PATCH /api/articles/:id/status error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/articles/:id/history
// Returns the full change history for an article, newest first.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/history', async (req, res) => {
  try {
    const article = await dbGet(
      'SELECT id, title FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const history = await dbAll(
      'SELECT * FROM ArticleHistory WHERE articleId = ? ORDER BY timestamp DESC',
      [req.params.id]
    );

    res.json({ success: true, article, count: history.length, data: history });
  } catch (err) {
    console.error('GET /api/articles/:id/history error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/articles/:id/history
// Manually log a remark/note against an article's history.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/history', async (req, res) => {
  try {
    const article = await dbGet(
      'SELECT id, status FROM KnowledgeArticle WHERE id = ?',
      [req.params.id]
    );

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const { action = 'note', editedBy = 'system', remarks = '' } = req.body;

    const result = await dbRun(
      `INSERT INTO ArticleHistory (articleId, action, oldStatus, newStatus, editedBy, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, action, article.status, article.status, editedBy, remarks]
    );

    const entry = await dbGet(
      'SELECT * FROM ArticleHistory WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('POST /api/articles/:id/history error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

