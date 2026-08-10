import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

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
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_ADDON_URI || process.env.DB_URL;
  const mysqlHost = process.env.MYSQL_HOST || process.env.MYSQL_ADDON_HOST || process.env.DB_HOST;

  if (dbUrl) {
    pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    isMySQL = true;
    console.log('Connected to MySQL database via Connection URL.');
  } else if (mysqlHost) {
    pool = mysql.createPool({
      host: mysqlHost,
      user: process.env.MYSQL_USER || process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'kingstar',
      port: Number(process.env.MYSQL_PORT || process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    isMySQL = true;
    console.log('Connected to MySQL database via host/user environment variables.');
  } else {
    const dbPath = path.join(dbDir, 'kingstar.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    isMySQL = false;
    console.log('MySQL environment variables not set. Falling back to local SQLite.');
  }
}

function cleanArgs(args: any[]): any[] {
  return (args || []).map(arg => (arg === undefined ? null : arg));
}

export async function dbRun(sql: string, args: any[] = []) {
  getDB();
  const sanitizedArgs = cleanArgs(args);
  if (pool) {
    // Replace SQLite ? with MySQL ? (which are the same for simple queries)
    const [result]: any = await pool.execute(sql, sanitizedArgs);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...sanitizedArgs);
    return { insertId: Number(result.lastInsertRowid), affectedRows: result.changes };
  }
  return { insertId: 0, affectedRows: 0 };
}

export async function dbGet(sql: string, args: any[] = []) {
  getDB();
  const sanitizedArgs = cleanArgs(args);
  if (pool) {
    const [rows]: any = await pool.execute(sql, sanitizedArgs);
    return rows[0] || undefined;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...sanitizedArgs);
  }
}

export async function dbAll(sql: string, args: any[] = []) {
  getDB();
  const sanitizedArgs = cleanArgs(args);
  if (pool) {
    const [rows]: any = await pool.execute(sql, sanitizedArgs);
    return rows as any[];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...sanitizedArgs) as any[];
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
          quantidade_minima INT DEFAULT 10,
          quantidade_maxima INT DEFAULT 100,
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
            await pool.execute(`
        CREATE TABLE IF NOT EXISTS qa_inspections (
          id INT AUTO_INCREMENT PRIMARY KEY,
          inventory_id INT,
          tipo VARCHAR(255) NOT NULL,
          quantidade_inspecionada INT NOT NULL,
          quantidade_aprovada INT NOT NULL,
          quantidade_rejeitada INT NOT NULL,
          status VARCHAR(255) NOT NULL,
          observacoes TEXT,
          inspector VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS qa_non_conformities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          inspection_id INT,
          inventory_id INT,
          description TEXT NOT NULL,
          severity VARCHAR(255),
          status VARCHAR(255) DEFAULT 'Aberta',
          action_taken TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inspection_id) REFERENCES qa_inspections(id) ON DELETE CASCADE,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);

      // Auto-migrate missing columns in existing MySQL tables
      const addColumnMySQL = async (table: string, col: string, definition: string) => {
        try {
          await pool!.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
          console.log(`Added missing column ${col} to MySQL table ${table}`);
        } catch (e: any) {
          // Ignore duplicate column errors (code 1060 / ER_DUP_FIELDNAME)
        }
      };
      await addColumnMySQL('inventory', 'fornecedor', 'VARCHAR(255)');
      await addColumnMySQL('inventory', 'medida', 'VARCHAR(255)');
      await addColumnMySQL('inventory', 'quantidade_minima', 'INT DEFAULT 10');
      await addColumnMySQL('inventory', 'quantidade_maxima', 'INT DEFAULT 100');
      await addColumnMySQL('inventory', 'status', "VARCHAR(255) DEFAULT 'Ativo'");
      await addColumnMySQL('movements', 'solicitacao', 'VARCHAR(255)');
      await addColumnMySQL('movements', 'status', 'VARCHAR(255)');

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS departamentos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(50) UNIQUE NOT NULL,
          nome VARCHAR(255) NOT NULL,
          descricao TEXT,
          responsavel VARCHAR(255),
          status VARCHAR(255) DEFAULT 'Ativo',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          departamento VARCHAR(255) NOT NULL,
          cargo VARCHAR(255),
          status VARCHAR(255) DEFAULT 'Ativo',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('MySQL schema initialized and validated.');
    } else if (sqliteDb) {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fornecedor TEXT,
          material TEXT NOT NULL,
          medida TEXT,
          quantidade INTEGER DEFAULT 0,
          quantidade_minima INTEGER DEFAULT 10,
          quantidade_maxima INTEGER DEFAULT 100,
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
            sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS qa_inspections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_id INTEGER,
          tipo TEXT NOT NULL,
          quantidade_inspecionada INTEGER NOT NULL,
          quantidade_aprovada INTEGER NOT NULL,
          quantidade_rejeitada INTEGER NOT NULL,
          status TEXT NOT NULL,
          observacoes TEXT,
          inspector TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS qa_non_conformities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inspection_id INTEGER,
          inventory_id INTEGER,
          description TEXT NOT NULL,
          severity TEXT,
          status TEXT DEFAULT 'Aberta',
          action_taken TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inspection_id) REFERENCES qa_inspections(id) ON DELETE CASCADE,
          FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
        )
      `);

      const addColumnSQLite = (table: string, col: string, definition: string) => {
        try {
          sqliteDb!.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
        } catch (e: any) {
          // Ignore duplicate column name errors
        }
      };
      addColumnSQLite('inventory', 'fornecedor', 'TEXT');
      addColumnSQLite('inventory', 'medida', 'TEXT');
      addColumnSQLite('inventory', 'quantidade_minima', 'INTEGER DEFAULT 10');
      addColumnSQLite('inventory', 'quantidade_maxima', 'INTEGER DEFAULT 100');
      addColumnSQLite('inventory', 'status', "TEXT DEFAULT 'Ativo'");
      addColumnSQLite('movements', 'solicitacao', 'TEXT');
      addColumnSQLite('movements', 'status', 'TEXT');

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS departamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nome TEXT NOT NULL,
          descricao TEXT,
          responsavel TEXT,
          status TEXT DEFAULT 'Ativo',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          departamento TEXT NOT NULL,
          cargo TEXT,
          status TEXT DEFAULT 'Ativo',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('SQLite schema initialized and validated.');
    }

    // Check and seed default departments
    const existingDepts = await dbAll('SELECT id FROM departamentos LIMIT 1');
    if (!existingDepts || existingDepts.length === 0) {
      console.log('Seeding default departments (Administrativo, Operacional, Qualidade)...');
      await dbRun(
        'INSERT INTO departamentos (codigo, nome, descricao, responsavel, status) VALUES (?, ?, ?, ?, ?)',
        ['ADM-01', 'Administrativo', 'Gestão Estratégica, Cadastros e Supervisão Geral do Almoxarifado', 'Gerente Administrativo', 'Ativo']
      );
      await dbRun(
        'INSERT INTO departamentos (codigo, nome, descricao, responsavel, status) VALUES (?, ?, ?, ?, ?)',
        ['OPR-02', 'Operacional', 'Logística, Movimentações de Entrada/Saída e Armazenagem', 'Almoxarife Líder', 'Ativo']
      );
      await dbRun(
        'INSERT INTO departamentos (codigo, nome, descricao, responsavel, status) VALUES (?, ?, ?, ?, ?)',
        ['QA-03', 'Qualidade', 'Inspeções de Qualidade, Planos CAPA, Quarentena e Instrumentos', 'Analista de QA', 'Ativo']
      );
      console.log('Default departments seeded successfully.');
    }

    // Check and seed default users
    const existingUsers = await dbAll('SELECT id FROM users LIMIT 1');
    if (!existingUsers || existingUsers.length === 0) {
      console.log('Seeding default departmental users with bcrypt password hashing...');
      const adminHash = bcrypt.hashSync('admin123', 10);
      const operHash = bcrypt.hashSync('operacional123', 10);
      const qaHash = bcrypt.hashSync('qualidade123', 10);

      await dbRun(
        'INSERT INTO users (nome, email, password_hash, departamento, cargo, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Administrador Geral', 'admin@kingstar.com', adminHash, 'Administrativo', 'Gerente Administrativo', 'Ativo']
      );
      await dbRun(
        'INSERT INTO users (nome, email, password_hash, departamento, cargo, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Operador Logística', 'operacional@kingstar.com', operHash, 'Operacional', 'Almoxarife', 'Ativo']
      );
      await dbRun(
        'INSERT INTO users (nome, email, password_hash, departamento, cargo, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Inspetor de Qualidade', 'qualidade@kingstar.com', qaHash, 'Qualidade', 'Analista de QA', 'Ativo']
      );
      console.log('Default users seeded successfully: admin@kingstar.com, operacional@kingstar.com, qualidade@kingstar.com');
    }
  } catch (err) {
    console.error('Failed to initialize schema:', err);
  }
}

export async function resetDatabase() {
  getDB();
  const tables = ['qa_non_conformities', 'qa_inspections', 'purchase_requests', 'movements', 'inventory'];
  if (pool) {
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) {
      try {
        await pool.execute(`TRUNCATE TABLE ${table}`);
      } catch (e) {
        await pool.execute(`DELETE FROM ${table}`);
      }
    }
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  } else if (sqliteDb) {
    sqliteDb.exec('PRAGMA foreign_keys = OFF;');
    for (const table of tables) {
      sqliteDb.exec(`DELETE FROM ${table};`);
    }
    sqliteDb.exec(`DELETE FROM sqlite_sequence WHERE name IN ('qa_non_conformities', 'qa_inspections', 'purchase_requests', 'movements', 'inventory');`);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
  }
}

