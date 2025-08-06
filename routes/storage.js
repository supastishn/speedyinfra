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

/**
 * @swagger
 * tags:
 *   name: Storage
 *   description: File storage operations
 */

/**
 * @swagger
 * /rest/v1/storage/upload:
 *   post:
 *     summary: Upload one or more files
 *     tags: [Storage]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Files uploaded successfully
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         example: 1722906169004-test-file.txt
 *                       originalname:
 *                         type: string
 *                         example: test-file.txt
 *                       size:
 *                         type: integer
 *                         example: 1234
 *                       mimetype:
 *                         type: string
 *                         example: text/plain
 *       400:
 *         description: Bad request (e.g., no files uploaded)
 */
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

/**
 * @swagger
 * /rest/v1/storage/files:
 *   get:
 *     summary: List all uploaded files
 *     tags: [Storage]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *     responses:
 *       200:
 *         description: An array of filenames
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
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

/**
 * @swagger
 * /rest/v1/storage/files/{filename}:
 *   get:
 *     summary: Download a specific file
 *     tags: [Storage]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 */
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

/**
 * @swagger
 * /rest/v1/storage/files/{filename}:
 *   delete:
 *     summary: Delete a specific file
 *     tags: [Storage]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
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
