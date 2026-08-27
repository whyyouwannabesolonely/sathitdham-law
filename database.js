const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'smartlaw.db'), (err) => {
  if (err) console.error(err.message);
  else console.log('Database connected.');
});

db.serialize(() => {
  // ตารางผู้ใช้งาน (Users)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullname TEXT NOT NULL
  )`, () => {
    // สร้าง User เริ่มต้น: admin / 1234
    db.run(`INSERT OR IGNORE INTO users (username, password, fullname) VALUES ('admin', '1234', 'Admin SATHITDHAM')`);
  });

  // ตารางนัดหมาย
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    appoint_date TEXT NOT NULL,
    appoint_type TEXT NOT NULL
  )`);

  // ตารางคดี
  db.run(`CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    black_number TEXT,
    red_number TEXT,
    court_name TEXT,
    lawyer_name TEXT,
    case_type TEXT,
    claim_amount REAL,
    status TEXT DEFAULT 'กำลังดำเนินการ',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ตารางลูกความ
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    client_type TEXT DEFAULT 'บุคคลทั่วไป',
    party_type TEXT DEFAULT 'plaintiff',
    phone TEXT,
    tax_id TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ตารางคลังเอกสาร
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at DATE DEFAULT CURRENT_DATE
  )`);
});

module.exports = db;