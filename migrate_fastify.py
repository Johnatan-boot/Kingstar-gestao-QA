import re
with open('server.ts', 'r') as f:
    code = f.read()

# Replace express imports
code = code.replace("import express from 'express';", "import Fastify from 'fastify';\nimport middie from '@fastify/middie';\nimport fastifyStatic from '@fastify/static';")

code = code.replace("const app = express();", "const app = Fastify({ logger: true });\n  await app.register(middie);")
code = code.replace("app.use(express.json());", "") # Fastify parses JSON by default

# Replace req, res with req, reply
code = re.sub(r'\((req|request), (res|reply)\) => {', r'(req, res) => {', code)
code = re.sub(r'res\.status\((\d+)\)\.json\(', r'res.status(\1).send(', code)
code = re.sub(r'res\.json\(', r'res.send(', code)

# Vite middleware
vite_setup = """    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);"""

fastify_vite_setup = """    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);"""

# Express static and catch-all
express_static = """    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });"""

fastify_static = """    const distPath = path.join(process.cwd(), 'dist');
    const mfePath = path.join(process.cwd(), 'dist-mfe');
    
    app.register(fastifyStatic, {
      root: mfePath,
      prefix: '/mfe/',
      decorateReply: false
    });

    app.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });
    
    app.setNotFoundHandler((req, res) => {
      res.sendFile('index.html');
    });"""

code = code.replace(express_static, fastify_static)

# Express listen
express_listen = """  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });"""

fastify_listen = """  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }"""

code = code.replace(express_listen, fastify_listen)

with open('server.ts', 'w') as f:
    f.write(code)

