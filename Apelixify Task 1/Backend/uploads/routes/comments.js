
// l
// add comment
app.post('/add_comment', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const post_id = parseInt(req.body.post_id || 0);
  const content = (req.body.content || '').trim();
  if (!post_id || !content) return res.json({ error: 'Missing data' });
  db.run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [post_id, req.session.user.id, content], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ ok: true });
  });
});

// add simple registration for test (optional)
app.post('/register', async (req,res) => {
  const { username, password, display_name } = req.body;
  if (!username || !password) return res.json({ error: 'Missing fields' });
  const hashed = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password, display_name, avatar) VALUES (?, ?, ?, ?)', [username, hashed, display_name || username, null], function(err){
    if (err) return res.json({ error: 'DB error' });
    res.json({ ok: true });
  });
});
