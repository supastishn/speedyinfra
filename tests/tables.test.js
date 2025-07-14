const request = require('supertest');
const app = require('../app');
const { getTableDB } = require('../util/db');

jest.setTimeout(15000);

// Generate unique project name for each test run
const TEST_PROJECT = `test_project_tables_${Date.now()}`;
const TEST_TABLE = 'test_data';

let authToken;

beforeAll(async () => {
  // Create test user and get token
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123'
  };
  
  // Add database readiness check
  const db = getTableDB(TEST_TABLE, TEST_PROJECT);
  await new Promise((resolve) => db.loadDatabase(resolve));
  
  // Register test user
  await request(app)
    .post('/rest/v1/auth/register')
    .set('X-Project-Name', TEST_PROJECT)
    .send(testUser);
  
  // Login to get token
  const loginRes = await request(app)
    .post('/rest/v1/auth/login')
    .set('X-Project-Name', TEST_PROJECT)
    .send(testUser);
    
  authToken = loginRes.body.token;
});

afterAll(async () => {
  // Cleanup project directory
  const fs = require('fs');
  const path = require('path');
  const projectPath = path.join(__dirname, `../projects/${TEST_PROJECT}`);
  
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

describe('Table CRUD API', () => {
  test('Create document', async () => {
    const res = await request(app)
      .post(`/rest/v1/tables/${TEST_TABLE}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Item', value: 42 });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('Read documents', async () => {
    const res = await request(app)
      .get(`/rest/v1/tables/${TEST_TABLE}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
