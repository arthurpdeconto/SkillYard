import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Criar/atualizar avaliação (um por par rater->ratee)
router.post('/', authRequired, async (req, res) => {
  try {
    const { ratee_id, stars, comment } = req.body;
    if (!ratee_id || !stars) return res.status(400).json({ error: 'ratee_id e stars são obrigatórios.' });
    const s = Math.max(1, Math.min(5, Number(stars)));
    // UPSERT manual (MySQL 8)
    await pool.query(
      `INSERT INTO ratings (rater_id, ratee_id, stars, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE stars = VALUES(stars), comment = VALUES(comment)`,
      [req.user.id, ratee_id, s, comment || null]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao avaliar.' });
  }
});

// Listar avaliações de um usuário
router.get('/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [[head]] = await pool.query(
      `SELECT u.id, u.username, COALESCE(r.avg_stars,0) AS avg_stars, COALESCE(r.ratings_count,0) AS ratings_count
       FROM users u
       LEFT JOIN user_avg_rating r ON r.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (!head) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const [items] = await pool.query(
      `SELECT rt.*, ru.username AS rater_name
       FROM ratings rt
       JOIN users ru ON ru.id = rt.rater_id
       WHERE rt.ratee_id = ?
       ORDER BY rt.created_at DESC
       LIMIT 100`,
      [userId]
    );
    res.json({ summary: head, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao listar avaliações.' });
  }
});

export default router;
