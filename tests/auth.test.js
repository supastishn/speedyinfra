const request = require('supertest');
const app = require('../app');
const { getTableDB } = require('../util/db');

// Use a unique project for auth tests
const TEST_PROJECT = 'test_project_auth';

// Create test user
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'password123'
};

beforeAll(() => {
  // Setup test project dir
  const userDB = getTableDB('_users', TEST_PROJECT);
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
