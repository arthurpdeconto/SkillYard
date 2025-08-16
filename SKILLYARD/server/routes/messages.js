import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Listar conversa com alguém (?with=USER_ID)
router.get('/', authRequired, async (req, res) => {
  try {
    const withId = Number(req.query.with);
    if (!withId) return res.status(400).json({ error: 'Parâmetro "with" obrigatório.' });
    const [rows] = await pool.query(
      `SELECT m.*, su.username AS sender_name, ru.username AS receiver_name
       FROM messages m
       JOIN users su ON su.id = m.sender_id
       JOIN users ru ON ru.id = m.receiver_id
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [req.user.id, withId, withId, req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao listar mensagens.' });
  }
});

// Enviar mensagem
router.post('/', authRequired, async (req, res) => {
  try {
    const { to, content } = req.body;
    if (!to || !content) return res.status(400).json({ error: 'Campos "to" e "content" são obrigatórios.' });
    const [r] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, to, content]
    );
    res.json({ id: r.insertId, to, content });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});

export default router;
