const express = require('express')
const app = express()
const port = 3000

// CORS support
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'apikey, Content-Type');
  next();
});

// Middleware for JSON body parsing
app.use(express.json());

// Mock authentication middleware
app.use('/rest/v1', (req, res, next) => {
  if (!req.headers['apikey']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Mock database storage (in-memory)
let mockDB = {};

// Select endpoint
app.get('/rest/v1/:table', async (req, res) => {
  res.status(200).json({ data: [] });
});

// Insert endpoint
app.post('/rest/v1/:table', async (req, res) => {
  const id = Date.now().toString();
  mockDB[id] = req.body;
  res.status(201).json({ id, ...req.body });
});

// Update endpoint
app.patch('/rest/v1/:table', async (req, res) => {
  res.status(200).json({ data: [] });
});

// Delete endpoint
app.delete('/rest/v1/:table', async (req, res) => {
  res.status(200).json({ data: [] });
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
