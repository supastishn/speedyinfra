const express = require('express');
const router = express.Router();
const { getTableDB, promisifyDBMethod } = require('../util/db');
const path = require('path');
const fs = require('fs');
const { tableDataSchema } = require('../util/validation');

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: Generic data table operations
 */

/**
 * @swagger
 * /rest/v1/tables/{table}/{id}:
 *   get:
 *     summary: Get a document by its ID
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested document
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 _id: "doc123"
 *                 name: "Laptop"
 *                 price: 1200
 *                 category: "electronics"
 *                 createdAt: "2025-08-06T00:00:00Z"
 *       404:
 *         description: Document not found
 */
router.get('/:table/:id', async (req, res) => {
  try {
    const db = getTableDB(req.params.table, req.projectName);
    const findOne = promisifyDBMethod(db, 'findOne');
    const doc = await findOne({ _id: req.params.id });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/tables/{table}/{id}:
 *   put:
 *     summary: Update (replace) a document by its ID
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: The full document to replace the existing one.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example:
 *             name: "Updated Laptop"
 *             price: 1250
 *             category: "electronics"
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modified:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid data provided
 *       404:
 *         description: Document not found
 */
router.put('/:table/:id', async (req, res) => {
  try {
    const { error } = tableDataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const db = getTableDB(req.params.table, req.projectName);
    const update = promisifyDBMethod(db, 'update');
    const numReplaced = await update({ _id: req.params.id }, { ...req.body, updatedAt: new Date() });
    if (numReplaced === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json({ modified: numReplaced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/tables/{table}/{id}:
 *   delete:
 *     summary: Delete a document by its ID
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Document not found
 */
router.delete('/:table/:id', async (req, res) => {
  try {
    const db = getTableDB(req.params.table, req.projectName);
    const remove = promisifyDBMethod(db, 'remove');
    const numRemoved = await remove({ _id: req.params.id }, {});
    if (numRemoved === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json({ deleted: numRemoved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/tables/{table}:
 *   get:
 *     summary: Query documents in a table
 *     description: "Query documents with pagination, sorting, and filtering. Filtering can be done on any field in the document using query parameters. For example, `?category=electronics&price_gte=100`. Supported operators are `_gte` (greater than or equal), `_lte` (less than or equal), and `_ne` (not equal)."
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of items per page
 *       - in: query
 *         name: _sort
 *         schema:
 *           type: string
 *           example: "price"
 *         description: Field to sort by
 *       - in: query
 *         name: _order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: "asc"
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example:
 *               - _id: "doc123"
 *                 name: "Laptop"
 *                 price: 1200
 *               - _id: "doc124"
 *                 name: "Keyboard"
 *                 price: 75
 *         headers:
 *           X-Total-Count:
 *             schema:
 *               type: integer
 *             description: Total number of matching documents
 */
router.get('/:table', async (req, res) => {
  try {
    const db = getTableDB(req.params.table, req.projectName);
    const { query } = req;

    const page = parseInt(query._page, 10) || 1;
    const limit = parseInt(query._limit, 10) || 10;
    const sortField = query._sort;
    const sortOrder = query._order === 'desc' ? -1 : 1;

    const filter = {};
    for (const key in query) {
      if (key.startsWith('_')) continue;
      
      if (key.endsWith('_gte')) {
        const field = key.slice(0, -4);
        filter[field] = { ...filter[field], $gte: query[key] };
      } else if (key.endsWith('_lte')) {
        const field = key.slice(0, -4);
        filter[field] = { ...filter[field], $lte: query[key] };
      } else if (key.endsWith('_ne')) {
        const field = key.slice(0, -3);
        filter[field] = { $ne: query[key] };
      } else {
        filter[key] = query[key];
      }
    }

    let cursor = db.find(filter);
    if (sortField) {
      cursor = cursor.sort({ [sortField]: sortOrder });
    }
    cursor = cursor.skip((page - 1) * limit).limit(limit);

    const promisifiedExec = () => new Promise((resolve, reject) => {
      cursor.exec((err, docs) => err ? reject(err) : resolve(docs));
    });
    
    const [docs, total] = await Promise.all([
      promisifiedExec(),
      promisifyDBMethod(db, 'count')(filter)
    ]);

    res.setHeader('X-Total-Count', total);
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/tables/{table}:
 *   post:
 *     summary: Create a new document in a table
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: A single document to create. The `_id` and `createdAt` fields are added automatically.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example:
 *             name: "New Product"
 *             price: 99.99
 *             category: "books"
 *     responses:
 *       201:
 *         description: Document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "newDoc456"
 *               name: "New Product"
 *               price: 99.99
 *               category: "books"
 *               createdAt: "2025-08-06T00:00:00.000Z"
 *       400:
 *         description: Invalid data provided
 */
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

/**
 * @swagger
 * /rest/v1/tables/{table}:
 *   patch:
 *     summary: Update documents matching a query
 *     description: "Update documents matching a filter. See GET `/{table}` for filter examples."
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: The fields to update.
 *           example:
 *             price: 1100
 *             tags: ["tech", "portable", "new"]
 *     responses:
 *       200:
 *         description: Number of documents modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modified:
 *                   type: integer
 *                   example: 2
 */
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

/**
 * @swagger
 * /rest/v1/tables/{table}:
 *   delete:
 *     summary: Delete documents matching a query
 *     description: "Delete documents matching a filter. See GET `/{table}` for filter examples."
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Number of documents deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: integer
 *                   example: 5
 */
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

/**
 * @swagger
 * /rest/v1/tables/{table}/_count:
 *   post:
 *     summary: Count documents matching a filter
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: A NeDB query object. See NeDB documentation for query syntax.
 *           example:
 *             category: "electronics"
 *             price: { "$gte": 100 }
 *     responses:
 *       200:
 *         description: The number of matching documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 10
 */
router.post('/:table/_count', async (req, res) => {
  try {
    const db = getTableDB(req.params.table, req.projectName);
    const count = promisifyDBMethod(db, 'count');
    const numDocs = await count(req.body || {});
    res.status(200).json({ count: numDocs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /rest/v1/tables/{table}/_folders:
 *   post:
 *     summary: Create a folder-like entity for a table (metadata purposes)
 *     tags: [Tables]
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectNameHeader'
 *       - in: path
 *         name: table
 *         required: true
 *         description: The name of the table to operate on.
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Folder created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Folder products created
 */
router.post('/:table/_folders', async (req, res) => {
  try {
    const tableName = req.params.table;
    const folderPath = path.join(__dirname, `../projects/${req.projectName}/_folders`);
    
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
