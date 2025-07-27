const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbs = {};

function getProjectConfig(projectName) {
  if (!projectName) {
    throw new Error('Project name is required');
  }
  const basePath = path.join(__dirname, `../projects/${projectName}`);
  const configPath = path.join(basePath, 'config.json');

  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  if (!fs.existsSync(configPath)) {
    const newSecret = crypto.randomBytes(32).toString('hex');
    const config = { jwtSecret: newSecret };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return config;
  }

  const configData = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configData);
}

function getTableDB(tableName, projectName = "") {
  if (!projectName) {
    throw new Error('Project name is required');
  }

  getProjectConfig(projectName);
  const basePath = path.join(__dirname, `../projects/${projectName}`);

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

module.exports = { getTableDB, promisifyDBMethod, getProjectConfig };
