import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Listar habilidades (público) com busca opcional
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT s.id, s.name, s.description, s.tags, s.user_id,
             u.username,
             COALESCE(r.avg_stars, 0) as avg_stars, COALESCE(r.ratings_count, 0) as ratings_count
      FROM skills s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN user_avg_rating r ON r.user_id = u.id
    `;
    const params = [];
    if (q) {
      sql += ` WHERE s.name LIKE ? OR s.tags LIKE ? OR s.description LIKE ?`;
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    sql += ` ORDER BY s.created_at DESC LIMIT 100`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar habilidades.' });
  }
});

// Criar habilidade (privado)
router.post('/', authRequired, async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

    const [result] = await pool.query(
      'INSERT INTO skills (user_id, name, description, tags) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description || null, tags || null]
    );
    res.json({ id: result.insertId, name, description, tags, user_id: req.user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar habilidade.' });
  }
});

export default router;
