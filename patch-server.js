import fs from 'fs';

const code = fs.readFileSync('server.ts', 'utf8');

const oldPut = `  app.put('/api/purchase-requests/:id', async (req, res) => {
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
  });`;

const newPut = `  app.put('/api/purchase-requests/:id', async (req, res) => {
    const { status, received_quantity, nf } = req.body;
    const { id } = req.params;
    try {
      if (status === 'Recebido') {
        // Obter a solicitação
        const reqData = await dbGet('SELECT * FROM purchase_requests WHERE id = ?', [id]);
        if (!reqData) {
          return res.status(404).json({ error: 'Purchase request not found' });
        }
        
        // Atualizar status
        await dbRun('UPDATE purchase_requests SET status = ? WHERE id = ?', ['Recebido', id]);
        
        // Registrar movimentação
        const qty = received_quantity || reqData.quantidade;
        await dbRun(
          'INSERT INTO movements (inventory_id, tipo, quantidade, status, solicitacao) VALUES (?, ?, ?, ?, ?)',
          [reqData.inventory_id, 'ENTRADA', qty, 'Recebimento de Compra' + (nf ? \` (NF: \${nf})\` : ''), 'REQ-' + id]
        );
        
        // Atualizar estoque
        await dbRun('UPDATE inventory SET quantidade = quantidade + ? WHERE id = ?', [qty, reqData.inventory_id]);
      } else {
        await dbRun('UPDATE purchase_requests SET status = ? WHERE id = ?', [status, id]);
      }
      res.json({ message: 'Purchase request updated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update purchase request' });
    }
  });`;

fs.writeFileSync('server.ts', code.replace(oldPut, newPut));
