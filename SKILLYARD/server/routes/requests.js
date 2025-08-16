import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Criar um pedido de troca (privado)
router.post('/', authRequired, async (req, res) => {
  try {
    const { receiver_id, skill_id, message } = req.body;
    if (!receiver_id || !skill_id) {
      return res.status(400).json({ error: 'receiver_id e skill_id são obrigatórios.' });
    }
    const [result] = await pool.query(
      `INSERT INTO requests (requester_id, receiver_id, skill_id, message)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, receiver_id, skill_id, message || null]
    );
    res.json({ id: result.insertId, receiver_id, skill_id, message, status: 'pending' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido.' });
  }
});

// Listar pedidos (privado): incoming/outgoing
router.get('/', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const [incoming] = await pool.query(
      `SELECT r.*, s.name AS skill_name, u.username AS requester_name
       FROM requests r
       JOIN skills s ON s.id = r.skill_id
       JOIN users u ON u.id = r.requester_id
       WHERE r.receiver_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const [outgoing] = await pool.query(
      `SELECT r.*, s.name AS skill_name, u.username AS receiver_name
       FROM requests r
       JOIN skills s ON s.id = r.skill_id
       JOIN users u ON u.id = r.receiver_id
       WHERE r.requester_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({ incoming, outgoing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar pedidos.' });
  }
});

// Atualizar status (accepted / declined / completed)
router.patch('/:id', authRequired, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'declined', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pedido não encontrado.' });

    const reqRow = rows[0];
    if (status !== 'completed' && reqRow.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o destinatário pode mudar para accepted/declined.' });
    }
    if (status === 'completed' && reqRow.receiver_id !== req.user.id && reqRow.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Somente participantes do pedido podem marcar como completed.' });
    }

    await pool.query('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ id: req.params.id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar pedido.' });
  }
});

export default router;
