const db = require('../config/db');

/**
 * Initializes all required database tables.
 * Called once at server startup.
 */
function initializeDatabase() {
  // Serialize ensures all CREATE TABLE statements run in order
  db.serialize(() => {

    // ── KnowledgeArticle ─────────────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS KnowledgeArticle (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        title          TEXT    NOT NULL,
        summary        TEXT,
        content        TEXT,
        tags           TEXT,
        status         TEXT    NOT NULL DEFAULT 'Draft'
                                CHECK(status IN ('Draft', 'Reviewed', 'Published')),
        sourceFileName TEXT,
        createdBy      TEXT,
        createdAt      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt      DATETIME DEFAULT CURRENT_TIMESTAMP,
        publishedAt    DATETIME,
        version        INTEGER  DEFAULT 1
      )
    `, (err) => {
      if (err) console.error('❌ KnowledgeArticle table error:', err.message);
      else console.log('✅ KnowledgeArticle table ready');
    });

    // ── SourceFile ────────────────────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS SourceFile (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        articleId     INTEGER REFERENCES KnowledgeArticle(id) ON DELETE SET NULL,
        fileName      TEXT    NOT NULL,
        fileType      TEXT,
        filePath      TEXT,
        extractedText TEXT,
        uploadedAt    DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ SourceFile table error:', err.message);
      else console.log('✅ SourceFile table ready');
    });

    // ── User ─────────────────────────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS User (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        name  TEXT    NOT NULL,
        email TEXT    UNIQUE NOT NULL,
        role  TEXT    NOT NULL DEFAULT 'Editor'
                      CHECK(role IN ('Editor', 'Reviewer', 'Admin'))
      )
    `, (err) => {
      if (err) console.error('❌ User table error:', err.message);
      else console.log('✅ User table ready');
    });

    // ── ArticleHistory ────────────────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS ArticleHistory (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        articleId INTEGER NOT NULL REFERENCES KnowledgeArticle(id) ON DELETE CASCADE,
        action    TEXT,
        oldStatus TEXT,
        newStatus TEXT,
        editedBy  TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        remarks   TEXT
      )
    `, (err) => {
      if (err) console.error('❌ ArticleHistory table error:', err.message);
      else console.log('✅ ArticleHistory table ready');
    });

    // ── ImportBatch ───────────────────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS ImportBatch (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        totalProcessed INTEGER DEFAULT 0,
        createdCount   INTEGER DEFAULT 0,
        duplicateCount INTEGER DEFAULT 0,
        failedCount    INTEGER DEFAULT 0,
        runAt          DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ ImportBatch table error:', err.message);
      else console.log('✅ ImportBatch table ready');
    });

    console.log('🗄️  Database initialization complete.');
  });
}

module.exports = { initializeDatabase };
