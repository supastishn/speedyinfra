const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

const dbs = {};
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

function getTableDB(tableName) {
  if (!dbs[tableName]) {
    dbs[tableName] = new Datastore({
      filename: path.join(dataDir, `${tableName}.db`),
      autoload: true
    });
  }
  return dbs[tableName];
}

function promisifyDBMethod(db, method) {
  return (...args) => new Promise((resolve, reject) => {
    db[method](...args, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

module.exports = { getTableDB, promisifyDBMethod };
