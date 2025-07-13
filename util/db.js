const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const dbs = {};

function getTableDB(tableName, projectName = "") {
  if (!projectName) {
    throw new Error('Project name is required');
  }

  const basePath = path.join(__dirname, `../../projects/${projectName}`);
  
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  if (!dbs[projectName]) {
    dbs[projectName] = {};
  }
  
  if (!dbs[projectName][tableName]) {
    dbs[projectName][tableName] = new Datastore({
      filename: path.join(basePath, `${tableName}.db`),
      autoload: true
    });
  }
  
  return dbs[projectName][tableName];
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
