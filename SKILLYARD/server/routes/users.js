import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Obter perfil público
router.get('/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const [[user]] = await pool.query(
      `SELECT u.id, u.username, u.email, u.bio, u.location, u.created_at,
              COALESCE(r.avg_stars,0) AS avg_stars, COALESCE(r.ratings_count,0) AS ratings_count
       FROM users u
       LEFT JOIN user_avg_rating r ON r.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const [skills] = await pool.query(
      'SELECT id, name, description, tags, created_at FROM skills WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json({ user, skills });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar perfil.' });
  }
});

// Obter meus dados
router.get('/me/profile', authRequired, async (req, res) => {
  try {
    const [[me]] = await pool.query(
      'SELECT id, username, email, bio, location, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    res.json(me);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar seu perfil.' });
  }
});

// Atualizar meu perfil
router.patch('/me/profile', authRequired, async (req, res) => {
  try {
    const { bio, location } = req.body;
    await pool.query('UPDATE users SET bio = ?, location = ? WHERE id = ?', [bio || null, location || null, req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

export default router;
