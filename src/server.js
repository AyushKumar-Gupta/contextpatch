import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import repositoryRoutes from './routes/repository.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 5000);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.resolve(__dirname, '../public')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', name: 'ContextPatch', version: '0.1.0' }));
app.use('/api/repository', repositoryRoutes);
app.use((err, _req, res, _next) => {
  const status = Number(err.status) || 500;
  res.status(status).json({ error: status === 500 ? 'Unexpected server error.' : err.message, detail: process.env.NODE_ENV === 'production' ? undefined : err.message });
});
app.listen(port, () => console.log(`ContextPatch is running at http://localhost:${port}`));
