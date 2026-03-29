import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import designsRouter from './routes/designs.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

[join(UPLOAD_DIR, 'models'), join(UPLOAD_DIR, 'thumbnails'), join(UPLOAD_DIR, 'covers')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const dataDir = join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads/models', express.static(UPLOAD_DIR + '/models'));
app.use('/uploads/thumbnails', express.static(UPLOAD_DIR + '/thumbnails'));
app.use('/uploads/covers', express.static(UPLOAD_DIR + '/covers'));

app.use('/api/designs', designsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/designs', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOAD_DIR}`);
});
