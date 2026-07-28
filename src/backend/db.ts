import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let pool: mysql.Pool | null = null;
let sqliteDb: DatabaseSync | null = null;
export let isMySQL = false;

function getDB() {
  if (pool || sqliteDb) return;
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    isMySQL = true;
    console.log('Connected to MySQL database via Clever Cloud.');
  } else {
    const dbPath = path.join(dbDir, 'kingstar.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    isMySQL = false;
    console.log('DATABASE_URL not set. Falling back to local SQLite.');
  }
}

export async function dbRun(sql: string, args: any[] = []) {
  getDB();
  if (pool) {
    // Replace SQLite ? with MySQL ? (which are the same for simple queries)
    const [result]: any = await pool.execute(sql, args);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...args);
    return { insertId: Number(result.lastInsertRowid), affectedRows: result.changes };
  }
  return { insertId: 0, affectedRows: 0 };
}

export async function dbGet(sql: string, args: any[] = []) {
  getDB();
  if (pool) {
    const [rows]: any = await pool.execute(sql, args);
    return rows[0] || undefined;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...args);
  }
}

export async function dbAll(sql: string, args: any[] = []) {
  getDB();
  if (pool) {
    const [rows]: any = await pool.execute(sql, args);
    return rows as any[];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...args) as any[];
  }
  return [];
}

export async function initDB() {
  getDB();
  try {
    if (pool) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fornecedor VARCHAR(255),
          material VARCHAR(255) NOT NULL,
          medida VARCHAR(255),
          quantidade INT DEFAULT 0,
          status VARCHAR(255) DEFAULT 'Ativo',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS movements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          inventory_id INT,
          tipo VARCHAR(255) NOT NULL,
          quantidade INT NOT NULL,
          status VARCHAR(255),
          solicitacao VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS purchase_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          inventory_id INT,
          material_name VARCHAR(255) NOT NULL,
          quantidade INT NOT NULL,
          status VARCHAR(255) DEFAULT 'Pendente',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);
      console.log('MySQL schema initialized.');
    } else if (sqliteDb) {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fornecedor TEXT,
          material TEXT NOT NULL,
          medida TEXT,
          quantidade INTEGER DEFAULT 0,
          status TEXT DEFAULT 'Ativo',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_id INTEGER,
          tipo TEXT NOT NULL,
          quantidade INTEGER NOT NULL,
          status TEXT,
          solicitacao TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS purchase_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_id INTEGER,
          material_name TEXT NOT NULL,
          quantidade INTEGER NOT NULL,
          status TEXT DEFAULT 'Pendente',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);
      console.log('SQLite schema initialized.');
    }
  } catch (err) {
    console.error('Failed to initialize schema:', err);
  }
}
