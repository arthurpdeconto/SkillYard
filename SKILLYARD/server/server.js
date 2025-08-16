import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import skillsRoutes from './routes/skills.js';
import requestsRoutes from './routes/requests.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';
import ratingsRoutes from './routes/ratings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ratings', ratingsRoutes);

// Static frontend
const publicDir = path.join(__dirname, '..', 'client', 'public');
app.use(express.static(publicDir));

// SPA fallback (single page)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SkillYard rodando em http://localhost:${PORT}`));


