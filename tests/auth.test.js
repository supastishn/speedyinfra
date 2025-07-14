const request = require('supertest');
const app = require('../app');
const { getTableDB, promisifyDBMethod } = require('../util/db');

// Generate unique project name for each test run
const TEST_PROJECT = `test_project_auth_${Date.now()}`;

// Create test user
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'password123'
};

beforeAll(async () => {
  // Setup test project dir by triggering DB initialization
  const usersDB = getTableDB('_users', TEST_PROJECT);
  // We don't need to do anything else, just creating the DB is enough
});

afterAll(() => {
  // Cleanup: remove test project directory
  const fs = require('fs');
  const path = require('path');
  const projectPath = path.join(__dirname, `../projects/${TEST_PROJECT}`);
  if (fs.existsSync(projectPath)) {
    fs.rmdirSync(projectPath, { recursive: true });
  }
});

describe('Auth API', () => {
  test('Register new user', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/register')
      .set('X-Project-Name', TEST_PROJECT)
      .send(TEST_USER);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', TEST_USER.email);
    expect(res.body).not.toHaveProperty('password');
  });

  test('Login with valid credentials', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/login')
      .set('X-Project-Name', TEST_PROJECT)
      .send(TEST_USER);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
