import fs from 'fs';

let code = fs.readFileSync('src/backend/db.ts', 'utf8');

const mysqlSchema = `      await pool.execute(\`
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
      \`);
      await pool.execute(\`
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
      \`);
      console.log('MySQL schema initialized.');`;

code = code.replace("console.log('MySQL schema initialized.');", mysqlSchema);

const sqliteSchema = `      sqliteDb.exec(\`
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
      \`);
      sqliteDb.exec(\`
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
      \`);
      console.log('SQLite schema initialized.');`;

code = code.replace("console.log('SQLite schema initialized.');", sqliteSchema);

fs.writeFileSync('src/backend/db.ts', code);
console.log("Patched db.ts");
