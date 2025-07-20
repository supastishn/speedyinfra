const express = require('express')
const app = express()
const port = 3000

const rest_v1_router = require('./routes/rest_v1');
const auth_router = require('./routes/auth');
const users_router = require('./routes/users');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  req.projectName = req.headers['x-project-name'] || 'speedyinfra';
  next();
});

app.use('/rest/v1', rest_v1_router);
app.use('/rest/v1/auth', auth_router);
app.use('/rest/v1/users', users_router);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}

module.exports = app;
