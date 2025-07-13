const express = require('express');
const router = express.Router();
const { getTableDB, promisifyDBMethod } = require('../util/db');

// Select endpoint
router.get('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table);
    const find = promisifyDBMethod(db, 'find');
    const docs = await find({});
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert endpoint
router.post('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table);
    const insert = promisifyDBMethod(db, 'insert');
    const newDoc = { ...req.body, createdAt: new Date() };
    const doc = await insert(newDoc);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update endpoint
router.patch('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table);
    const update = promisifyDBMethod(db, 'update');
    const affected = await update(req.query, { $set: req.body }, { multi: true });
    res.status(200).json({ modified: affected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete endpoint
router.delete('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table);
    const remove = promisifyDBMethod(db, 'remove');
    const result = await remove(req.query, { multi: true });
    res.status(200).json({ deleted: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
