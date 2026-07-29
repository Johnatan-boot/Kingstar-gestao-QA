import { initDB, dbRun, pool, sqliteDb } from './src/backend/db.js';

async function update() {
  await initDB();
  try {
    await dbRun('ALTER TABLE inventory ADD COLUMN quantidade_minima INT DEFAULT 10');
  } catch (e) { console.log('Column quantidade_minima might already exist'); }
  try {
    await dbRun('ALTER TABLE inventory ADD COLUMN quantidade_maxima INT DEFAULT 100');
  } catch (e) { console.log('Column quantidade_maxima might already exist'); }
  console.log('Schema updated.');
}
update();
