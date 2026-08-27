const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mlraapeailbefpzqyzil.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_secret_d7aH4i8jVe-W53fKYcwUZw_34-q0L5i';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

// --- Appointments API (Delete) ---
app.delete('/api/appointments/:id', async (req, res) => {
  const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Auth API ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).maybeSingle();
  if (error || !data) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  res.json({ success: true, user: data });
});

// --- Appointments API ---
app.get('/api/appointments', async (req, res) => {
  const { data, error } = await supabase.from('appointments').select('*').order('appoint_date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/appointments', async (req, res) => {
  const { title, appoint_date, appoint_time, appoint_type, black_number, red_number, court_name } = req.body;
  const { data, error } = await supabase.from('appointments').insert([{ 
    title, 
    appoint_date, 
    appoint_time: appoint_time || '09:00', 
    appoint_type,
    black_number: black_number || '',
    red_number: red_number || '',
    court_name: court_name || ''
  }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data[0].id, success: true });
});

app.put('/api/appointments/:id', async (req, res) => {
  const { title, appoint_date, appoint_time, appoint_type, black_number, red_number, court_name } = req.body;
  const { error } = await supabase.from('appointments').update({ 
    title, 
    appoint_date, 
    appoint_time: appoint_time || '09:00', 
    appoint_type,
    black_number: black_number || '',
    red_number: red_number || '',
    court_name: court_name || ''
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Cases API ---
app.get('/api/cases', async (req, res) => {
  const { data, error } = await supabase.from('cases').select('*').order('id', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/cases', async (req, res) => {
  const { category, black_number, red_number, court_name, lawyer_name, case_type, claim_amount } = req.body;
  const { data, error } = await supabase.from('cases').insert([{
    category: category || 'คดีแพ่ง', black_number, red_number, court_name, lawyer_name, case_type, claim_amount: Number(claim_amount) || 0
  }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data[0].id });
});

app.put('/api/cases/:id', async (req, res) => {
  const { category, black_number, red_number, court_name, lawyer_name, case_type, claim_amount } = req.body;
  const { error } = await supabase.from('cases').update({
    category: category || 'คดีแพ่ง', black_number, red_number, court_name, lawyer_name, case_type, claim_amount: Number(claim_amount) || 0
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/cases/:id', async (req, res) => {
  const { error } = await supabase.from('cases').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Clients API ---
app.get('/api/clients', async (req, res) => {
  let query = supabase.from('clients').select('*').order('id', { ascending: false });
  if (req.query.party_type) query = query.eq('party_type', req.query.party_type);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/clients', async (req, res) => {
  const { name, client_type, party_type, phone, tax_id, address } = req.body;
  const { data, error } = await supabase.from('clients').insert([{ name, client_type, party_type, phone, tax_id, address }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data[0].id });
});

app.put('/api/clients/:id', async (req, res) => {
  const { name, client_type, phone, tax_id, address } = req.body;
  const { error } = await supabase.from('clients').update({ name, client_type, phone, tax_id, address }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/clients/:id', async (req, res) => {
  const { error } = await supabase.from('clients').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Documents API (Storage) ---
app.get('/api/documents', async (req, res) => {
  const { data, error } = await supabase.from('documents').select('*').order('id', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const fileExt = path.extname(req.file.originalname).replace('.', '').toUpperCase();
  const fileName = `${Date.now()}-${Buffer.from(req.file.originalname, 'latin1').toString('utf8')}`;

  const { error: uploadErr } = await supabase.storage.from('documents').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
  if (uploadErr) return res.status(500).json({ error: uploadErr.message });

  const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);

  const { data, error: dbErr } = await supabase.from('documents').insert([{
    title: req.body.title || req.file.originalname,
    file_path: publicUrlData.publicUrl,
    file_type: fileExt
  }]).select();

  if (dbErr) return res.status(500).json({ error: dbErr.message });
  res.json({ id: data[0].id });
});

// --- Appointments API ---
app.get('/api/appointments', async (req, res) => {
  const { data, error } = await supabase.from('appointments').select('*').order('appoint_date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/appointments', async (req, res) => {
  const { title, appoint_date, appoint_time, appoint_type } = req.body;
  const { data, error } = await supabase.from('appointments').insert([{ title, appoint_date, appoint_time, appoint_type }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data[0].id, success: true });
});

app.put('/api/appointments/:id', async (req, res) => {
  const { title, appoint_date, appoint_time, appoint_type } = req.body;
  const { error } = await supabase.from('appointments').update({ title, appoint_date, appoint_time, appoint_type }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/documents/:id', async (req, res) => {
  const { data: doc } = await supabase.from('documents').select('file_path').eq('id', req.params.id).maybeSingle();
  if (doc && doc.file_path) {
    const fileName = doc.file_path.split('/').pop();
    await supabase.storage.from('documents').remove([fileName]);
  }
  const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`SmartLaw System running on port ${PORT}`));
