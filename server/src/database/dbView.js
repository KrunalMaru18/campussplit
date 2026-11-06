const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../../data/campussplit.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
});

const arg = process.argv.slice(2).join(' ').trim();

if (!arg || arg === '--summary' || arg === '-s') {
  console.log('\n======================================================');
  console.log(' CampusSplit SQLite Database Explorer');
  console.log(' File Path: ' + dbPath);
  console.log('======================================================\n');

  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", [], (err, tables) => {
    if (err) {
      console.error(err);
      db.close();
      return;
    }

    let completed = 0;
    const stats = [];

    tables.forEach((t) => {
      db.get('SELECT COUNT(*) as count FROM ' + t.name, (err, row) => {
        stats.push({
          Table: t.name,
          Records: err ? 'Error' : row.count,
        });
        completed++;
        if (completed === tables.length) {
          console.table(stats);
          console.log('\n💡 Quick Commands:');
          console.log('  • View table:      npm run db:view users');
          console.log('  • View groups:     npm run db:view groups');
          console.log('  • Run SQL query:   npm run db:query "SELECT id, name, email, raw_password FROM users"');
          console.log('  • GUI App:         Open file in "DB Browser for SQLite"');
          console.log('======================================================\n');
          db.close();
        }
      });
    });
  });
} else if (arg.toUpperCase().startsWith('SELECT') || arg.toUpperCase().startsWith('PRAGMA')) {
  console.log('\n🔍 Executing SQL: ' + arg + '\n');
  db.all(arg, [], (err, rows) => {
    if (err) {
      console.error('❌ SQL Error:', err.message);
    } else {
      console.table(rows);
      console.log('\n(Returned ' + rows.length + ' rows)\n');
    }
    db.close();
  });
} else {
  const tableName = arg;
  console.log('\n📋 Viewing table: [' + tableName + ']\n');
  db.all('SELECT * FROM ' + tableName + ' LIMIT 50', [], (err, rows) => {
    if (err) {
      console.error('❌ Error querying table ' + tableName + ':', err.message);
    } else {
      console.table(rows);
      console.log('\n(Showing ' + rows.length + ' rows)\n');
    }
    db.close();
  });
}
