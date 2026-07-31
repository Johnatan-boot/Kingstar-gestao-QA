import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const qaRoutes = `
  // QA Routes
  app.get('/api/qa/inspections', async (req, res) => {
    try {
      const items = await dbAll(\`
        SELECT q.*, i.material as material_name 
        FROM qa_inspections q 
        LEFT JOIN inventory i ON q.inventory_id = i.id 
        ORDER BY q.created_at DESC
      \`);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inspections' });
    }
  });

  app.post('/api/qa/inspections', async (req, res) => {
    const { inventory_id, tipo, quantidade_inspecionada, quantidade_aprovada, quantidade_rejeitada, status, observacoes, inspector } = req.body;
    try {
      const result = await dbRun(
        'INSERT INTO qa_inspections (inventory_id, tipo, quantidade_inspecionada, quantidade_aprovada, quantidade_rejeitada, status, observacoes, inspector) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [inventory_id, tipo, quantidade_inspecionada, quantidade_aprovada, quantidade_rejeitada, status, observacoes, inspector || 'Auto']
      );
      
      // If there are rejected items, automatically create a non-conformity (RNC)
      if (quantidade_rejeitada > 0) {
        await dbRun(
          'INSERT INTO qa_non_conformities (inspection_id, inventory_id, description, severity, status) VALUES (?, ?, ?, ?, ?)',
          [result.insertId, inventory_id, \`Reprovação automática na inspeção (\${quantidade_rejeitada} itens rejeitados)\`, 'Alta', 'Aberta']
        );
      }
      
      res.status(201).json({ message: 'Inspection created' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create inspection' });
    }
  });

  app.get('/api/qa/rncs', async (req, res) => {
    try {
      const items = await dbAll(\`
        SELECT r.*, i.material as material_name 
        FROM qa_non_conformities r 
        LEFT JOIN inventory i ON r.inventory_id = i.id 
        ORDER BY r.created_at DESC
      \`);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch RNCs' });
    }
  });

  app.post('/api/qa/rncs', async (req, res) => {
    const { inventory_id, description, severity } = req.body;
    try {
      await dbRun(
        'INSERT INTO qa_non_conformities (inventory_id, description, severity, status) VALUES (?, ?, ?, ?)',
        [inventory_id, description, severity, 'Aberta']
      );
      res.status(201).json({ message: 'RNC created' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create RNC' });
    }
  });
  
  app.put('/api/qa/rncs/:id', async (req, res) => {
    const { status, action_taken } = req.body;
    const { id } = req.params;
    try {
      await dbRun(
        'UPDATE qa_non_conformities SET status = ?, action_taken = ? WHERE id = ?',
        [status, action_taken || '', id]
      );
      res.json({ message: 'RNC updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update RNC' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
`;

code = code.replace("  if (process.env.NODE_ENV !== 'production') {", qaRoutes);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
