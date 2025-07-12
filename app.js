const express = require('express')
const app = express()
const port = 3000

// Include routers
const rest_v1_router = require('./routes/rest_v1');

// CORS support
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'apikey, Content-Type');
  next();
});

// Middleware for JSON body parsing
app.use(express.json());

// Mount the REST v1 router at /rest/v1
app.use('/rest/v1', rest_v1_router);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
