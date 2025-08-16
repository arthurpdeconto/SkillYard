const API = {
  token: () => localStorage.getItem('skillyard_token') || null,
  setToken: (t) => localStorage.setItem('skillyard_token', t),
  clearToken: () => localStorage.removeItem('skillyard_token'),

  async get(url){
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.token()}` }
    });
    if(!res.ok) throw new Error((await res.json()).error || 'Erro');
    return res.json();
  },

  async post(url, data){
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token() ? { 'Authorization': `Bearer ${this.token()}` } : {})
      },
      body: JSON.stringify(data || {})
    });
    if(!res.ok) throw new Error((await res.json()).error || 'Erro');
    return res.json();
  },

  async patch(url, data){
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token()}`
      },
      body: JSON.stringify(data || {})
    });
    if(!res.ok) throw new Error((await res.json()).error || 'Erro');
    return res.json();
  }
};


// ----- Deletar Skill
app.delete('/api/skills/:id', authMiddleware, async (req, res) => {
  try {
    const skillId = req.params.id;

    
    const [rows] = await pool.query('SELECT id, user_id FROM skills WHERE id=? LIMIT 1', [skillId]);
    if (!rows.length) return res.status(404).json({ error: 'Skill não encontrada' });
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não pode excluir essa skill' });
    }

    await pool.query('DELETE FROM skills WHERE id=?', [skillId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'erro no servidor' });
  }
});
