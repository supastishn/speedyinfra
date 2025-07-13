const request = require('supertest');
const app = require('../app');
const { getTableDB } = require('../util/db');

// Use a unique project for table tests
const TEST_PROJECT = 'test_project_tables';
const TEST_TABLE = 'test_data';

let authToken;

beforeAll(async () => {
  // Setup test project dir
  const db = getTableDB(TEST_TABLE, TEST_PROJECT);

  // Create test user and get token
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123'
  };
  
  await request(app)
    .post('/rest/v1/auth/register')
    .set('X-Project-Name', TEST_PROJECT)
    .send(testUser);
  
  const loginRes = await request(app)
    .post('/rest/v1/auth/login')
    .set('X-Project-Name', TEST_PROJECT)
    .send(testUser);
  
  authToken = loginRes.body.token;
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
