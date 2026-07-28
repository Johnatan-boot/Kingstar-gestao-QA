import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDB, dbAll, dbRun, dbGet, isMySQL } from './src/backend/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  app.use(express.json());

  // Initialize DB
  await initDB();

  // API Routes
  app.get('/api/inventory', async (req, res) => {
    try {
      const items = await dbAll('SELECT * FROM inventory ORDER BY created_at DESC');
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  app.post('/api/inventory', async (req, res) => {
    const { fornecedor, material, medida, quantidade, status } = req.body;
    try {
      await dbRun(
        'INSERT INTO inventory (fornecedor, material, medida, quantidade, status) VALUES (?, ?, ?, ?, ?)',
        [fornecedor, material, medida, quantidade || 0, status || 'Ativo']
      );
      res.status(201).json({ message: 'Item created' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  app.put('/api/inventory/:id', async (req, res) => {
    const { fornecedor, material, medida, quantidade, status } = req.body;
    const { id } = req.params;
    try {
      await dbRun(
        'UPDATE inventory SET fornecedor = ?, material = ?, medida = ?, quantidade = ?, status = ? WHERE id = ?',
        [fornecedor, material, medida, quantidade, status, id]
      );
      res.json({ message: 'Item updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  app.delete('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await dbRun('DELETE FROM inventory WHERE id = ?', [id]);
      await dbRun('DELETE FROM movements WHERE inventory_id = ?', [id]);
      res.json({ message: 'Item deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  app.get('/api/movements', async (req, res) => {
    try {
      const items = await dbAll(`
        SELECT m.*, i.material as material_name, i.fornecedor as material_fornecedor
        FROM movements m
        LEFT JOIN inventory i ON m.inventory_id = i.id
        ORDER BY m.created_at DESC
        LIMIT 50
      `);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch movements' });
    }
  });

  app.post('/api/movements', async (req, res) => {
    const { inventory_id, tipo, quantidade, status, solicitacao } = req.body;
    try {
      await dbRun(
        'INSERT INTO movements (inventory_id, tipo, quantidade, status, solicitacao) VALUES (?, ?, ?, ?, ?)',
        [inventory_id, tipo, quantidade, status, solicitacao]
      );
      
      // Update inventory quantity
      if (tipo === 'ENTRADA') {
        await dbRun('UPDATE inventory SET quantidade = quantidade + ? WHERE id = ?', [quantidade, inventory_id]);
      } else if (tipo === 'SAIDA') {
        await dbRun('UPDATE inventory SET quantidade = quantidade - ? WHERE id = ?', [quantidade, inventory_id]);
      }
      
      res.status(201).json({ message: 'Movement created' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create movement' });
    }
  });

  app.get('/api/stats', async (req, res) => {
    try {
      const [totalItems] = await dbAll('SELECT COUNT(*) as count FROM inventory');
      const [aguardandoQA] = await dbAll("SELECT COUNT(*) as count FROM movements WHERE status = 'QA Pendente'");
      const todayQuery = isMySQL 
        ? "SELECT COUNT(*) as count FROM movements WHERE DATE(created_at) = CURDATE()"
        : "SELECT COUNT(*) as count FROM movements WHERE date(created_at) = date('now')";
      const [solicitacoesHoje] = await dbAll(todayQuery);
      
      const barChartData = await dbAll(`
        SELECT material as name, quantidade as count 
        FROM inventory 
        WHERE status = 'Ativo'
        ORDER BY quantidade DESC 
        LIMIT 8
      `);

      res.json({
        totalItems: totalItems?.count || 0,
        aguardandoQA: aguardandoQA?.count || 0,
        solicitacoesHoje: solicitacoesHoje?.count || 0,
        barChartData
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/purchase-requests', async (req, res) => {
    try {
      const items = await dbAll('SELECT * FROM purchase_requests ORDER BY created_at DESC');
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch purchase requests' });
    }
  });

  app.post('/api/purchase-requests', async (req, res) => {
    const { inventory_id, material_name, quantidade, status } = req.body;
    try {
      await dbRun(
        'INSERT INTO purchase_requests (inventory_id, material_name, quantidade, status) VALUES (?, ?, ?, ?)',
        [inventory_id, material_name, quantidade, status || 'Pendente']
      );
      res.status(201).json({ message: 'Purchase request created' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create purchase request' });
    }
  });

  app.put('/api/purchase-requests/:id', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    try {
      await dbRun(
        'UPDATE purchase_requests SET status = ? WHERE id = ?',
        [status, id]
      );
      res.json({ message: 'Purchase request updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update purchase request' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

createServer();
