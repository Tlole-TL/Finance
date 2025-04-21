const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise'); // Use promise-based MySQL2
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT = path.resolve(__dirname, '..');
const STATIC = path.join(PROJECT, 'WebPage', 'static');
const TEMPLATES = path.join(PROJECT, 'WebPage', 'templates');

// Body parser & static
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(STATIC));

// Sessions
app.use(session({
  secret: process.env.SECRET_KEY || require('crypto').randomBytes(16).toString('hex'),
  resave: false,
  saveUninitialized: false
}));

// MySQL connection
const dbConfig = {
  host: 'localhost',
  user: 'forFinance',
  password: '25Finance25@',
  database: 'Finance'
};

// Create a MySQL connection pool
const db = mysql.createPool(dbConfig);

// Root → redirect to login
app.get('/', (_, res) => res.redirect('/login'));

// Auth page for login/signup
app.get('/auth', (_, res) =>
  res.sendFile(path.join(TEMPLATES, 'auth.html'))
);

// Login route
app.get('/login', (req, res) => {
  const err = req.query.error ? `&error=${req.query.error}` : '';
  res.redirect(`/auth?mode=login${err}`);
});

// Signup route
app.get('/signup', (req, res) => {
  const err = req.query.error ? `&error=${req.query.error}` : '';
  res.redirect(`/auth?mode=signup${err}`);
});

// 6️⃣ Login route - verify username and password
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    console.warn('Login missing fields');
    return res.redirect('/login?error=invalid');
  }

  try {
    // Query the database for the username
    const [rows] = await db.query('SELECT id, password FROM users WHERE NAME = ?', [username]);

    // Check if the user exists
    if (rows.length === 0) {
      console.warn('Incorrect username or password');
      return res.redirect('/login?error=invalid');
    }

    const user = rows[0];
    // Compare the entered password with the stored hash
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      console.log(`Login successful for ${username}`);
      req.session.userId = user.id; // Store user ID in session

      // Redirect to home.html after successful login
      return res.sendFile(path.join(TEMPLATES, 'home.html')); // Send home.html to the user
    } else {
      console.warn('Incorrect username or password');
      return res.redirect('/login?error=invalid');
    }
  } catch (e) {
    console.error('Error during login process:', e.message);
    return res.status(500).send('Server error');
  }
});

// Start the server
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
