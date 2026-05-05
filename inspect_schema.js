const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(
  path.join(__dirname, 'backend', 'database', 'knowledge_base.db')
);

db.all(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  [],
  (err, tables) => {
    if (err) { console.error(err); return; }

    console.log('╔══════════════════════════════════════╗');
    console.log('║     SQLite Database Schema Report    ║');
    console.log('╚══════════════════════════════════════╝\n');
    console.log('Tables found:', tables.map(t => t.name).join(', '), '\n');

    let done = 0;
    tables.forEach(({ name }) => {
      db.all(`PRAGMA table_info(${name})`, [], (err2, cols) => {
        console.log(`┌─ TABLE: ${name}`);
        console.log('│  ' + ['cid','name','type','notnull','default','pk']
          .map(h => h.padEnd(14)).join(''));
        console.log('│  ' + '─'.repeat(85));
        cols.forEach(c => {
          const row = [
            String(c.cid),
            c.name,
            c.type,
            c.notnull ? 'NOT NULL' : '',
            c.dflt_value || '',
            c.pk ? 'PK' : ''
          ].map(v => v.padEnd(14)).join('');
          console.log('│  ' + row);
        });
        console.log('└' + '─'.repeat(87) + '\n');

        if (++done === tables.length) {
          db.all(
            "SELECT name FROM sqlite_master WHERE type='index' ORDER BY tbl_name",
            [],
            (err3, idxs) => {
              if (idxs.length) {
                console.log('Indexes:', idxs.map(i => i.name).join(', '));
              }
              db.close();
            }
          );
        }
      });
    });
  }
);
