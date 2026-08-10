import Fastify from 'fastify';
import middie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDB, dbAll, dbRun, dbGet, isMySQL, resetDatabase } from './src/backend/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kingstar-secret-key-2026';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = Fastify({ logger: true });
  await app.register(middie);
  

  // Initialize DB
  await initDB();

  // --- AUTHENTICATION & USERS API ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { nome, email, password, departamento, cargo } = req.body;
      if (!nome || !email || !password || !departamento) {
        return res.status(400).send({ error: 'Preencha todos os campos obrigatórios: Nome, E-mail, Senha e Departamento.' });
      }

      const validDepartamentos = ['Administrativo', 'Operacional', 'Qualidade'];
      if (!validDepartamentos.includes(departamento)) {
        return res.status(400).send({ error: 'Departamento inválido. Escolha Administrativo, Operacional ou Qualidade.' });
      }

      const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(409).send({ error: 'Este e-mail já está cadastrado no sistema.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await dbRun(
        'INSERT INTO users (nome, email, password_hash, departamento, cargo, status) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, email, passwordHash, departamento, cargo || 'Colaborador', 'Ativo']
      );

      const userId = result.insertId;
      const user = {
        id: userId,
        nome,
        email,
        departamento,
        cargo: cargo || 'Colaborador',
        status: 'Ativo'
      };

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '12h' });

      res.status(201).send({
        message: 'Usuário cadastrado com sucesso!',
        token,
        user
      });
    } catch (error: any) {
      console.error('Error registering user:', error);
      res.status(500).send({ error: 'Erro ao cadastrar usuário: ' + (error.message || '') });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).send({ error: 'Informe e-mail e senha para autenticação.' });
      }

      const user: any = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(401).send({ error: 'E-mail ou senha incorretos.' });
      }

      if (user.status === 'Inativo') {
        return res.status(403).send({ error: 'Conta inativa. Consulte o Gerente Administrativo.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).send({ error: 'E-mail ou senha incorretos.' });
      }

      const userPayload = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        departamento: user.departamento,
        cargo: user.cargo,
        status: user.status
      };

      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });

      res.send({
        message: 'Login efetuado com sucesso!',
        token,
        user: userPayload
      });
    } catch (error: any) {
      console.error('Error logging in user:', error);
      res.status(500).send({ error: 'Erro ao autenticar usuário: ' + (error.message || '') });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: 'Token não fornecido ou inválido.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);

      const user: any = await dbGet(
        'SELECT id, nome, email, departamento, cargo, status, created_at FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!user) {
        return res.status(404).send({ error: 'Usuário não encontrado no banco de dados.' });
      }

      res.send(user);
    } catch (error) {
      res.status(401).send({ error: 'Sessão expirada ou token inválido.' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await dbAll('SELECT id, nome, email, departamento, cargo, status, created_at FROM users ORDER BY created_at DESC');
      res.send(users);
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch users' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (Number(id) === 1) {
        return res.status(403).send({ error: 'Não é permitido remover a conta Principal do Administrador.' });
      }
      await dbRun('DELETE FROM users WHERE id = ?', [id]);
      res.send({ message: 'Usuário removido com sucesso' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to delete user' });
    }
  });

  app.put('/api/users/:id/departamento', async (req, res) => {
    try {
      const { id } = req.params;
      const { departamento, cargo, status } = req.body;
      await dbRun(
        'UPDATE users SET departamento = ?, cargo = ?, status = ? WHERE id = ?',
        [departamento, cargo, status || 'Ativo', id]
      );
      res.send({ message: 'Dados do usuário atualizados' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to update user' });
    }
  });

  // --- DEPARTAMENTOS API ---
  app.get('/api/departamentos', async (req, res) => {
    try {
      const depts = await dbAll('SELECT * FROM departamentos ORDER BY id ASC');
      res.send(depts);
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch departamentos' });
    }
  });

  app.post('/api/departamentos', async (req, res) => {
    try {
      const { codigo, nome, descricao, responsavel, status } = req.body;
      if (!codigo || !nome) {
        return res.status(400).send({ error: 'Código e Nome são obrigatórios.' });
      }
      const result = await dbRun(
        'INSERT INTO departamentos (codigo, nome, descricao, responsavel, status) VALUES (?, ?, ?, ?, ?)',
        [codigo, nome, descricao || '', responsavel || '', status || 'Ativo']
      );
      res.status(201).send({ id: result.insertId, message: 'Departamento cadastrado com sucesso!' });
    } catch (error: any) {
      res.status(500).send({ error: 'Erro ao cadastrar departamento: ' + (error.message || '') });
    }
  });

  app.put('/api/departamentos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { codigo, nome, descricao, responsavel, status } = req.body;
      await dbRun(
        'UPDATE departamentos SET codigo = ?, nome = ?, descricao = ?, responsavel = ?, status = ? WHERE id = ?',
        [codigo, nome, descricao || '', responsavel || '', status || 'Ativo', id]
      );
      res.send({ message: 'Departamento atualizado com sucesso!' });
    } catch (error: any) {
      res.status(500).send({ error: 'Erro ao atualizar departamento: ' + (error.message || '') });
    }
  });

  app.delete('/api/departamentos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbRun('DELETE FROM departamentos WHERE id = ?', [id]);
      res.send({ message: 'Departamento removido com sucesso!' });
    } catch (error: any) {
      res.status(500).send({ error: 'Erro ao remover departamento' });
    }
  });

  // API Routes
  app.get('/api/inventory', async (req, res) => {
    try {
      const items = await dbAll('SELECT * FROM inventory ORDER BY created_at DESC');
      res.send(items);
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch inventory' });
    }
  });

  app.post('/api/inventory', async (req, res) => {
    const { fornecedor, material, medida, quantidade, quantidade_minima, quantidade_maxima, status } = req.body;
    try {
      const result = await dbRun(
        'INSERT INTO inventory (fornecedor, material, medida, quantidade, quantidade_minima, quantidade_maxima, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          fornecedor ?? '',
          material ?? '',
          medida ?? '',
          Number(quantidade) || 0,
          Number(quantidade_minima) || 10,
          Number(quantidade_maxima) || 100,
          status || 'Ativo'
        ]
      );
      res.status(201).send({ message: 'Item created', id: result.insertId });
    } catch (error) {
      console.error('Error creating inventory item:', error);
      res.status(500).send({ error: 'Failed to create item', details: String(error) });
    }
  });

  app.put('/api/inventory/:id', async (req, res) => {
    const { fornecedor, material, medida, quantidade, quantidade_minima, quantidade_maxima, status } = req.body;
    const { id } = req.params;
    try {
      await dbRun(
        'UPDATE inventory SET fornecedor = ?, material = ?, medida = ?, quantidade = ?, quantidade_minima = ?, quantidade_maxima = ?, status = ? WHERE id = ?',
        [
          fornecedor ?? '',
          material ?? '',
          medida ?? '',
          Number(quantidade) || 0,
          Number(quantidade_minima) || 10,
          Number(quantidade_maxima) || 100,
          status || 'Ativo',
          id
        ]
      );
      res.send({ message: 'Item updated' });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).send({ error: 'Failed to update item', details: String(error) });
    }
  });

  app.delete('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await dbRun('DELETE FROM inventory WHERE id = ?', [id]);
      await dbRun('DELETE FROM movements WHERE inventory_id = ?', [id]);
      res.send({ message: 'Item deleted' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to delete item' });
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
      res.send(items);
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch movements' });
    }
  });

  app.post('/api/movements', async (req, res) => {
    const { inventory_id, tipo, quantidade, status, solicitacao } = req.body;
    try {
      await dbRun(
        'INSERT INTO movements (inventory_id, tipo, quantidade, status, solicitacao) VALUES (?, ?, ?, ?, ?)',
        [inventory_id, tipo, quantidade, status || null, solicitacao || null]
      );
      
      // Update inventory quantity
      if (tipo === 'ENTRADA') {
        await dbRun('UPDATE inventory SET quantidade = quantidade + ? WHERE id = ?', [quantidade, inventory_id]);
      } else if (tipo === 'SAIDA') {
        await dbRun('UPDATE inventory SET quantidade = quantidade - ? WHERE id = ?', [quantidade, inventory_id]);
      }
      
      res.status(201).send({ message: 'Movement created' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to create movement' });
    }
  });

  app.get('/api/stats', async (req, res) => {
    try {
      let totalItemsCount = 0;
      let aguardandoQACount = 0;
      let solicitacoesHojeCount = 0;
      let barChartData: any[] = [];

      try {
        const [totalItems] = await dbAll('SELECT COUNT(*) as count FROM inventory');
        totalItemsCount = totalItems?.count || 0;
      } catch (e) {
        console.error('Error fetching totalItems:', e);
      }

      try {
        const [aguardandoQA] = await dbAll("SELECT COUNT(*) as count FROM movements WHERE status = 'QA Pendente'");
        aguardandoQACount = aguardandoQA?.count || 0;
      } catch (e) {
        console.error('Error fetching aguardandoQA:', e);
      }

      try {
        const todayQuery = isMySQL 
          ? "SELECT COUNT(*) as count FROM movements WHERE DATE(created_at) = CURDATE()"
          : "SELECT COUNT(*) as count FROM movements WHERE date(created_at) = date('now')";
        const [solicitacoesHoje] = await dbAll(todayQuery);
        solicitacoesHojeCount = solicitacoesHoje?.count || 0;
      } catch (e) {
        console.error('Error fetching solicitacoesHoje:', e);
      }

      try {
        barChartData = await dbAll(`
          SELECT material as name, COALESCE(quantidade, 0) as count 
          FROM inventory 
          WHERE status = 'Ativo' OR status IS NULL OR status = ''
          ORDER BY quantidade DESC 
          LIMIT 8
        `);
      } catch (e) {
        console.error('Error fetching barChartData:', e);
      }

      res.send({
        totalItems: totalItemsCount,
        aguardandoQA: aguardandoQACount,
        solicitacoesHoje: solicitacoesHojeCount,
        barChartData
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      res.status(500).send({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/purchase-requests', async (req, res) => {
    try {
      const items = await dbAll('SELECT * FROM purchase_requests ORDER BY created_at DESC');
      res.send(items);
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch purchase requests' });
    }
  });

  app.post('/api/purchase-requests', async (req, res) => {
    const { inventory_id, material_name, quantidade, status } = req.body;
    try {
      await dbRun(
        'INSERT INTO purchase_requests (inventory_id, material_name, quantidade, status) VALUES (?, ?, ?, ?)',
        [inventory_id, material_name, quantidade, status || 'Pendente']
      );
      res.status(201).send({ message: 'Purchase request created' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to create purchase request' });
    }
  });

  app.put('/api/purchase-requests/:id', async (req, res) => {
    const { status, received_quantity, nf } = req.body;
    const { id } = req.params;
    try {
      if (status === 'Recebido') {
        // Obter a solicitação
        const reqData = await dbGet('SELECT * FROM purchase_requests WHERE id = ?', [id]);
        if (!reqData) {
          return res.status(404).send({ error: 'Purchase request not found' });
        }
        
        // Atualizar status
        await dbRun('UPDATE purchase_requests SET status = ? WHERE id = ?', ['Recebido', id]);
        
        // Registrar movimentação
        const qty = received_quantity || reqData.quantidade;
        await dbRun(
          'INSERT INTO movements (inventory_id, tipo, quantidade, status, solicitacao) VALUES (?, ?, ?, ?, ?)',
          [reqData.inventory_id, 'ENTRADA', qty, 'Recebimento de Compra' + (nf ? ` (NF: ${nf})` : ''), 'REQ-' + id]
        );
        
        // Atualizar estoque
        await dbRun('UPDATE inventory SET quantidade = quantidade + ? WHERE id = ?', [qty, reqData.inventory_id]);
      } else {
        await dbRun('UPDATE purchase_requests SET status = ? WHERE id = ?', [status, id]);
      }
      res.send({ message: 'Purchase request updated' });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Failed to update purchase request' });
    }
  });


  // QA Routes
  app.get('/api/qa/inspections', async (req, res) => {
    try {
      const items = await dbAll(`
        SELECT q.*, i.material as material_name 
        FROM qa_inspections q 
        LEFT JOIN inventory i ON q.inventory_id = i.id 
        ORDER BY q.created_at DESC
      `);
      res.send(items);
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch inspections' });
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
          [result.insertId, inventory_id, `Reprovação automática na inspeção (${quantidade_rejeitada} itens rejeitados)`, 'Alta', 'Aberta']
        );
      }
      
      res.status(201).send({ message: 'Inspection created' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to create inspection' });
    }
  });

  app.get('/api/qa/rncs', async (req, res) => {
    try {
      const items = await dbAll(`
        SELECT r.*, i.material as material_name 
        FROM qa_non_conformities r 
        LEFT JOIN inventory i ON r.inventory_id = i.id 
        ORDER BY r.created_at DESC
      `);
      res.send(items);
    } catch (error) {
      res.status(500).send({ error: 'Failed to fetch RNCs' });
    }
  });

  app.post('/api/qa/rncs', async (req, res) => {
    const { inventory_id, description, severity } = req.body;
    try {
      await dbRun(
        'INSERT INTO qa_non_conformities (inventory_id, description, severity, status) VALUES (?, ?, ?, ?)',
        [inventory_id, description, severity, 'Aberta']
      );
      res.status(201).send({ message: 'RNC created' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to create RNC' });
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
      res.send({ message: 'RNC updated' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to update RNC' });
    }
  });

  app.post('/api/database/reset', async (req, res) => {
    try {
      await resetDatabase();
      res.send({ message: 'Banco de dados zerado com sucesso.' });
    } catch (error: any) {
      console.error('Error resetting database:', error);
      res.status(500).send({ error: 'Falha ao zerar banco de dados', details: String(error) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Serve MFE files from dist-mfe in dev as well to allow testing federation
    app.register(fastifyStatic, {
      root: path.join(__dirname, 'dist-mfe'),
      prefix: '/mfe/',
      decorateReply: false
    });

    app.use((req, res, next) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/mfe')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    // Production mode
    app.register(fastifyStatic, {
      root: path.join(__dirname, 'dist-mfe'),
      prefix: '/mfe/',
      decorateReply: false
    });

    app.register(fastifyStatic, {
      root: path.join(__dirname, 'dist'),
      prefix: '/',
    });
    
    app.setNotFoundHandler((req, res) => {
      res.sendFile('index.html');
    });
  }

  const port = 3000;
  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

createServer();
