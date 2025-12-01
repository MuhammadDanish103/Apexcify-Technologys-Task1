
// --- POSTS API ---
app.post('/create_post', upload.single('media'), (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const caption = (req.body.caption || '').trim();
  let media_path = null;
  let media_type = null;

  if (req.file) {
    media_path = 'uploads/' + req.file.filename;
    const m = req.file.mimetype || '';
    media_type = m.startsWith('image') ? 'image' : (m.startsWith('video') ? 'video' : 'unknown');
  }

  db.run('INSERT INTO posts (user_id, caption, media_path, media_type) VALUES (?, ?, ?, ?)',
    [req.session.user.id, caption, media_path, media_type],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB insert failed' });

      const postId = this.lastID;
      // fetch and return full post info
      db.get(`SELECT p.*, u.username, u.display_name, u.avatar
              FROM posts p JOIN users u ON u.id = p.user_id
              WHERE p.id = ?`, [postId], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB fetch failed' });
        // like/comment counts
        db.get('SELECT COUNT(*) AS c FROM likes WHERE post_id = ?', [postId], (e, lrow) => {
          row.like_count = lrow ? lrow.c : 0;
          row.comment_count = 0;
          row.media_url = row.media_path || null;
          row.liked = false;
          res.json({ ok: true, post: row });
        });
      });
    });
});

// fetch posts (feed)
app.get('/get_posts', (req, res) => {
  db.all(`SELECT p.*, u.username, u.display_name, u.avatar
          FROM posts p JOIN users u ON u.id = p.user_id
          ORDER BY p.created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const posts = rows.map(r => {
      return {
        ...r,
        media_url: r.media_path || null,
        avatar: r.avatar || null
      };
    });
    res.json({ posts });
  });
});

// get single post
app.get('/get_posts.php', (req, res) => {
  const id = parseInt(req.query.id || 0);
  if (!id) return res.json({ error: 'Missing id' });
  db.get(`SELECT p.*, u.username, u.display_name, u.avatar
          FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`, [id], (err, row) => {
    if (err || !row) return res.json({ error: 'Not found' });
    db.all('SELECT c.content, u.username, u.display_name, u.avatar FROM comments c JOIN users u ON u.id=c.user_id WHERE c.post_id = ? ORDER BY c.created_at DESC LIMIT 50', [id], (e, comments) => {
      db.get('SELECT COUNT(*) AS c FROM likes WHERE post_id = ?', [id], (ee, likeRow) => {
        row.comments = (comments || []).reverse();
        row.like_count = likeRow ? likeRow.c : 0;
        row.media_url = row.media_path || null;
        res.json({ post: row });
      });
    });
  });
});

// my posts (notifications list)
app.get('/my_posts', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  db.all('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ posts: rows });
  });
});

