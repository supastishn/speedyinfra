const express = require('express');
const router = express.Router();

// Mock database storage (in-memory)
let mockDB = {};

// Select endpoint
router.get('/:table', async (req, res) => {
  res.status(200).json({ data: [] });
});

// Insert endpoint
router.post('/:table', async (req, res) => {
  const id = Date.now().toString();
  mockDB[id] = req.body;
  res.status(201).json({ id, ...req.body });
});

// Update endpoint
router.patch('/:table', async (req, res) => {
  res.status(200).json({ data: [] });
});

// Delete endpoint
router.delete('/:table', async (req, res) => {
  res.status(200).json({ data: [] });
});

module.exports = router;
