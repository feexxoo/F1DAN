require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./users.db');

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  id_file TEXT
)`);

// Middleware
app.use(session({
  secret: 'secure_f1dan_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('.'));

// File uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'ids'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register route
app.post('/register', upload.single('id_file'), async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const idFile = req.file ? req.file.filename : null;

  db.run(`INSERT INTO users (email, password, id_file) VALUES (?, ?, ?)`,
    [email, hashedPassword, idFile],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(400).send('User already exists or error.');
      }

      const mailOptions = {
        from: 'F1DAN <' + process.env.EMAIL_USER + '>',
        to: process.env.EMAIL_USER,
        subject: 'New F1DAN Registration',
        text: `New user registered with email: ${email}`,
        attachments: idFile ? [{
          filename: idFile,
          path: path.join(__dirname, 'ids', idFile)
        }] : []
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Email send error:', err);
        } else {
          console.log('Email sent:', info.response);
        }
      });

      res.send('User registered successfully.');
    });
});

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).send('User not found.');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('Wrong password.');
    req.session.userId = user.id;
    res.send('Login successful.');
  });
});

app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
