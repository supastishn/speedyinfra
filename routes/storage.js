const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, `../projects/${req.projectName}/uploads`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Upload one or more files
router.post('/upload', upload.array('files', 12), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send({ message: 'Please upload at least one file.' });
  }
  const uploadedFiles = req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  }));
  res.status(201).json({ message: 'Files uploaded successfully', files: uploadedFiles });
});

// List all files
router.get('/files', (req, res) => {
  const uploadPath = path.join(__dirname, `../projects/${req.projectName}/uploads`);
  if (!fs.existsSync(uploadPath)) {
    return res.status(200).json([]);
  }
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan files' });
    }
    res.status(200).json(files);
  });
});

// Download a specific file
router.get('/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, `../projects/${req.projectName}/uploads`, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath, (err) => {
    if (err) {
      console.error("File download error:", err);
    }
  });
});

// Delete a specific file
router.delete('/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, `../projects/${req.projectName}/uploads`, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not delete file' });
    }
    res.status(200).json({ message: 'File deleted successfully' });
  });
});

module.exports = router;
