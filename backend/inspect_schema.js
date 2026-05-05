const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(
  path.join(__dirname, 'database', 'knowledge_base.db'),
  sqlite3.OPEN_READONLY
);

db.all(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  [],
  function (err, tables) {
    if (err) { console.error('DB Error:', err.message); return; }

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║      SQLite Schema Report                ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('Tables found:', tables.map(function(t){ return t.name; }).join(', '), '\n');

    var done = 0;
    tables.forEach(function (t) {
      db.all('PRAGMA table_info(' + t.name + ')', [], function (err2, cols) {
        console.log('┌─ TABLE: ' + t.name);
        var header = '  ' +
          'cid'.padEnd(5) +
          'column'.padEnd(18) +
          'type'.padEnd(14) +
          'not_null'.padEnd(10) +
          'default'.padEnd(24) +
          'pk';
        console.log(header);
        console.log('  ' + '─'.repeat(75));
        cols.forEach(function (c) {
          var line = '  ' +
            String(c.cid).padEnd(5) +
            c.name.padEnd(18) +
            c.type.padEnd(14) +
            (c.notnull ? 'YES' : 'no').padEnd(10) +
            (c.dflt_value || '').padEnd(24) +
            (c.pk ? 'PK' : '');
          console.log(line);
        });
        console.log('');

        if (++done === tables.length) {
          // Also show row counts
          console.log('══ Row counts ══');
          var c2done = 0;
          tables.forEach(function (t2) {
            db.get('SELECT COUNT(*) as cnt FROM ' + t2.name, [], function (err3, row) {
              console.log('  ' + t2.name.padEnd(20) + ': ' + row.cnt + ' row(s)');
              if (++c2done === tables.length) {
                console.log('\nSchema check complete.\n');
                db.close();
              }
            });
          });
        }
      });
    });
  }
);
