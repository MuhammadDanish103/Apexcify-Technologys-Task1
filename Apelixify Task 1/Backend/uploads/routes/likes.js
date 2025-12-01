ikes
app.post('/like', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const post_id = parseInt(req.body.post_id || req.body.postId || 0);
  if (!post_id) return res.json({ error: 'Missing post id' });

  db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [post_id, req.session.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (row) {
      // unlike
      db.run('DELETE FROM likes WHERE id = ?', [row.id], function(err2) {
        if (err2) return res.status(500).json({ error: 'DB error' });
        res.json({ ok: true, removed: true });
      });
    } else {
      db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post_id, req.session.user.id], function(err2) {
        if (err2) return res.status(500).json({ error: 'DB error' });
        res.json({ ok: true, added: true });
      });
    }
  });
});
