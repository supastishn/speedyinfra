const express = require('express');
const router = express.Router();
const { getTableDB, promisifyDBMethod } = require('../util/db');
const path = require('path');
const fs = require('fs');
const { tableDataSchema } = require('../util/validation');

router.get('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table, req.projectName);
    const find = promisifyDBMethod(db, 'find');
    const docs = await find(req.query);
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:table', async (req, res) => {
  try {
    const { error } = tableDataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const db = getTableDB(req.params.table, req.projectName);
    const insert = promisifyDBMethod(db, 'insert');
    const newDoc = { ...req.body, createdAt: new Date() };
    const doc = await insert(newDoc);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table, req.projectName);
    const update = promisifyDBMethod(db, 'update');
    const affected = await update(req.query, { $set: req.body }, { multi: true });
    res.status(200).json({ modified: affected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table, req.projectName);
    const remove = promisifyDBMethod(db, 'remove');
    const result = await remove(req.query, { multi: true });
    res.status(200).json({ deleted: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:table/_folders', async (req, res) => {
  try {
    const tableName = req.params.table;
    const folderPath = path.join(__dirname, `../../projects/${req.projectName}/_folders`);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    fs.writeFileSync(path.join(folderPath, `${tableName}.txt`), 'Folder metadata');
    res.status(201).json({ message: `Folder ${tableName} created` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
