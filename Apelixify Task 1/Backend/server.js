const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');
const UPLOADS = path.join(__dirname, 'uploads');

// ensure uploads folders
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(path.join(UPLOADS, 'profile'))) fs.mkdirSync(path.join(UPLOADS, 'profile'), { recursive: true });

app.use(express.static(PUBLIC));
app.use('/uploads', express.static(UPLOADS));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'replace_this_with_a_secure_secret',
  resave: false,
  saveUninitialized: false
}));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = Date.now() + '-' + Math.random().toString(36).slice(2,8) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|webm|ogg/;
    const ok = allowed.test(file.mimetype) || allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  }
});


app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/auth', (req, res) => {
  res.json({ user: req.session.user || null });
});

// update avatar
app.post('/update_avatar', upload.single('avatar'), (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const p = 'profile/' + req.file.filename;
  const dbPath = 'uploads/' + req.file.filename;

  db.run('UPDATE users SET avatar = ? WHERE id = ?', [dbPath, req.session.user.id], err => {
    if (err) return res.status(500).json({ error: 'DB update failed' });
    // update session user avatar
    req.session.user.avatar = dbPath;
    res.json({ ok: true, path: dbPath });
  });
});



app.listen(PORT, () => console.log('Server started on', PORT));
