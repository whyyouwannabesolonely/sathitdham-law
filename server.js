const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- Auth API ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT id, username, fullname FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    res.json({ success: true, user });
  });
});

// --- Appointments API ---
app.get('/api/appointments', (req, res) => {
  db.all('SELECT * FROM appointments ORDER BY appoint_date ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/appointments', (req, res) => {
  const { title, appoint_date, appoint_type } = req.body;
  const sql = 'INSERT INTO appointments (title, appoint_date, appoint_type) VALUES (?, ?, ?)';
  db.run(sql, [title, appoint_date, appoint_type], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.put('/api/appointments/:id', (req, res) => {
  const { title, appoint_date, appoint_type } = req.body;
  const sql = 'UPDATE appointments SET title = ?, appoint_date = ?, appoint_type = ? WHERE id = ?';
  db.run(sql, [title, appoint_date, appoint_type, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/appointments/:id', (req, res) => {
  db.run('DELETE FROM appointments WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// --- Cases API ---
app.get('/api/cases', (req, res) => {
  db.all('SELECT * FROM cases ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/cases', (req, res) => {
  const { category, black_number, red_number, court_name, lawyer_name, case_type, claim_amount } = req.body;
  db.run('INSERT INTO cases (category, black_number, red_number, court_name, lawyer_name, case_type, claim_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [category || 'คดีแพ่ง', black_number, red_number, court_name, lawyer_name, case_type, claim_amount], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.put('/api/cases/:id', (req, res) => {
  const { category, black_number, red_number, court_name, lawyer_name, case_type, claim_amount } = req.body;
  const sql = `UPDATE cases SET category = ?, black_number = ?, red_number = ?, court_name = ?, lawyer_name = ?, case_type = ?, claim_amount = ? WHERE id = ?`;
  db.run(sql, [category || 'คดีแพ่ง', black_number, red_number, court_name, lawyer_name, case_type, claim_amount, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/cases/:id', (req, res) => {
  db.run('DELETE FROM cases WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// --- Clients API ---
app.get('/api/clients', (req, res) => {
  const { party_type } = req.query;
  const sql = party_type ? 'SELECT * FROM clients WHERE party_type = ? ORDER BY id DESC' : 'SELECT * FROM clients ORDER BY id DESC';
  db.all(sql, party_type ? [party_type] : [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/clients', (req, res) => {
  const { name, client_type, party_type, phone, tax_id, address } = req.body;
  db.run('INSERT INTO clients (name, client_type, party_type, phone, tax_id, address) VALUES (?, ?, ?, ?, ?, ?)',
    [name, client_type, party_type, phone, tax_id, address], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.put('/api/clients/:id', (req, res) => {
  const { name, client_type, phone, tax_id, address } = req.body;
  const sql = 'UPDATE clients SET name = ?, client_type = ?, phone = ?, tax_id = ?, address = ? WHERE id = ?';
  db.run(sql, [name, client_type, phone, tax_id, address, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/clients/:id', (req, res) => {
  db.run('DELETE FROM clients WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// --- Documents API ---
app.get('/api/documents', (req, res) => {
  db.all('SELECT * FROM documents ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/documents', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const ext = path.extname(req.file.originalname).replace('.', '').toUpperCase();
  db.run('INSERT INTO documents (title, file_path, file_type) VALUES (?, ?, ?)',
    [req.body.title || req.file.originalname, req.file.filename, ext], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.delete('/api/documents/:id', (req, res) => {
  db.get('SELECT file_path FROM documents WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row && row.file_path) {
      const filePath = path.join(__dirname, 'uploads', row.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.run('DELETE FROM documents WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, changes: this.changes });
    });
  });
});

app.listen(PORT, () => console.log(`SmartLaw System running at http://localhost:${PORT}`));
