// server.js
const express       = require('express');
const path          = require('path');
const session       = require('express-session');
const bcrypt        = require('bcrypt');
const mysql         = require('mysql2/promise');
require('dotenv').config();

const app   = express();
const PORT  = process.env.PORT || 3000;
const PROJECT   = path.resolve(__dirname, '..');
const STATIC    = path.join(PROJECT, 'WebPage', 'static');
const TEMPLATES = path.join(PROJECT, 'WebPage', 'templates');

app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(STATIC));
app.use(session({
  secret: process.env.SECRET_KEY || require('crypto').randomBytes(16).toString('hex'),
  resave: false,
  saveUninitialized: false
}));

// Database
const db = mysql.createPool({
  host:     'localhost',
  user:     'forFinance',
  password: '25Finance25@',
  database: 'Finance'
});

// Redirect root → login
app.get('/', (_, res) => res.redirect('/login'));

// Auth page (login/signup)
app.get('/auth', (_, res) =>
  res.sendFile(path.join(TEMPLATES, 'auth.html'))
);

// Login & Signup routes
app.get('/login', (req, res) => {
  const err    = req.query.error   ? `&error=${req.query.error}`   : '';
  const signup = req.query.signup  ? `&signup=${req.query.signup}` : '';
  res.redirect(`/auth?mode=login${err}${signup}`);
});
app.get('/signup', (req, res) => {
  const err = req.query.error ? `&error=${req.query.error}` : '';
  res.redirect(`/auth?mode=signup${err}`);
});

// Handle Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect('/login?error=invalid');

  try {
    const [rows] = await db.query(
      'SELECT id, password FROM users WHERE NAME = ?',
      [username]
    );
    if (rows.length === 0) return res.redirect('/login?error=invalid');

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.redirect('/login?error=invalid');

    req.session.userId = rows[0].id;
    res.sendFile(path.join(TEMPLATES, 'home.html'));
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).send('Server error');
  }
});

// Handle Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect('/signup?error=invalid');

  try {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE NAME = ?',
      [username]
    );
    if (rows.length > 0) return res.redirect('/signup?error=exists');

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (NAME, PASSWORD) VALUES (?, ?)',
      [username, hash]
    );
    res.redirect('/login?signup=success');
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
