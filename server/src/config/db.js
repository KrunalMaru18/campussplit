const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

let dbType = 'sqlite'; // 'postgres' or 'sqlite'
let pgPool = null;
let sqliteDb = null;

async function initDbClient() {
  // Check if PostgreSQL is available with provided DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const { Pool } = require('pg');
      const testPool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 3000,
      });
      // Test connection
      await testPool.query('SELECT 1');
      console.log(' connected to PostgreSQL successfully');
      pgPool = testPool;
      dbType = 'postgres';
      return;
    } catch (err) {
      console.warn(`⚠️ PostgreSQL connection attempt failed (${err.message}). Using persistent local SQLite database.`);
    }
  }

  // Fallback to SQLite
  dbType = 'sqlite';
  const sqlite3 = require('sqlite3').verbose();
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'campussplit.db');

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Failed to open SQLite database:', err.message);
    } else {
      console.log(` Connected to persistent SQLite database at: ${dbPath}`);
    }
  });

  // Enable foreign keys in SQLite
  sqliteDb.run('PRAGMA foreign_keys = ON');
}

/**
 * Universal query runner: translates $1, $2 to ? for sqlite and normalizes results
 */
function query(text, params = []) {
  if (dbType === 'postgres' && pgPool) {
    return pgPool.query(text, params);
  }

  // SQLite execution
  return new Promise((resolve, reject) => {
    let sqliteSql = text;
    // Replace $1, $2 with ?
    sqliteSql = sqliteSql.replace(/\$(\d+)/g, '?');

    // Clean PostgreSQL specific types if any
    sqliteSql = sqliteSql.replace(/UUID PRIMARY KEY/gi, 'TEXT PRIMARY KEY');
    sqliteSql = sqliteSql.replace(/TIMESTAMP WITH TIME ZONE/gi, 'DATETIME');
    sqliteSql = sqliteSql.replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL');
    sqliteSql = sqliteSql.replace(/NOW\(\)/gi, "datetime('now')");

    const trimmed = sqliteSql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: (rows || []).length });
      });
    } else {
      sqliteDb.run(sqliteSql, params, function (err) {
        if (err) return reject(err);
        resolve({
          rows: [],
          rowCount: this.changes,
          lastID: this.lastID,
        });
      });
    }
  });
}

/**
 * Initialize all database tables
 */
async function createTables() {
  const isPostgres = dbType === 'postgres';

  const userTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      raw_password TEXT,
      avatar_url TEXT,
      upi_id TEXT,
      is_admin INTEGER DEFAULT 0,
      admin_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const groupTable = `
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'General',
      invite_code TEXT UNIQUE NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const groupMemberTable = `
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const expenseTable = `
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'General',
      paid_by_id TEXT NOT NULL,
      split_type TEXT DEFAULT 'EQUAL',
      notes TEXT,
      expense_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (paid_by_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const expenseSplitTable = `
    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount_owed REAL NOT NULL,
      percentage REAL,
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const settlementTable = `
    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      payer_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'UPI',
      notes TEXT,
      settlement_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  await query(userTable);
  await query(groupTable);
  await query(groupMemberTable);
  await query(expenseTable);
  await query(expenseSplitTable);
  await query(settlementTable);

  // Safe migration for existing databases: add is_admin and admin_id if not present
  try {
    await query('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
  } catch (e) {
    // column already exists
  }
  try {
    await query('ALTER TABLE users ADD COLUMN admin_id TEXT');
  } catch (e) {
    // column already exists
  }
  try {
    await query('ALTER TABLE users ADD COLUMN raw_password TEXT');
  } catch (e) {
    // column already exists
  }

  // Populate any existing users without raw_password
  await query("UPDATE users SET raw_password = 'password123' WHERE raw_password IS NULL");

  // Ensure Krunal has Super Admin privileges and specific Admin ID
  await query(
    `UPDATE users 
     SET is_admin = 1, admin_id = 'ADMIN-KRUNAL-007' 
     WHERE email = 'krunal@campus.edu'`
  );

  console.log(' Database tables initialized and admin roles configured.');
}

module.exports = {
  initDbClient,
  query,
  createTables,
  getDbType: () => dbType,
};
