const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3200;

// ─── 1. SERVE public/ ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── 2. ENSURE uploads/ EXISTS ────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── 3. MULTER SETUP ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ts       = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${ts}-${safeName}`);
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const ext     = path.extname(file.originalname).slice(1).toLowerCase();
  allowed.test(ext)
    ? cb(null, true)
    : cb(new Error('Invalid file type'), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }  // 10 MB
});

// ─── 4. ROUTES ────────────────────────────────────────────────────────────────
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ message: 'Uploaded', filename: req.file.filename });
});

app.get('/files', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not list files' });
    res.json({ files });
  });
});

app.get('/files/:filename', (req, res) => {
  const fp = path.join(UPLOAD_DIR, req.params.filename);
  fs.access(fp, fs.constants.F_OK, err => {
    if (err) return res.status(404).json({ error: 'Not found' });
    res.download(fp, err => {
      if (err) res.status(500).json({ error: 'Download error' });
    });
  });
});

// ─── 5. ERROR HANDLER ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  if (err)                               return res.status(500).json({ error: err.message });
  next();
});

// ─── 6. START ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server up on http://localhost:${PORT}`));
