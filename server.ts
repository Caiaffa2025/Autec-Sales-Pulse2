import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import { registerApiRoutes } from './server/routes.ts';

async function startServer(): Promise<void> {
  initDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'Autec Sales Pulse' });
  });

  registerApiRoutes(app);

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Autec Sales Pulse rodando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar o servidor Autec Sales Pulse:', err);
  process.exit(1);
});
