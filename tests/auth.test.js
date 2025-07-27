const request = require('supertest');
const app = require('../app');
const { getTableDB, promisifyDBMethod } = require('../util/db');

jest.setTimeout(15000);

const TEST_PROJECT = `test_project_auth_${Date.now()}`;

const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'password123'
};

beforeAll(async () => {
  const usersDB = getTableDB('_users', TEST_PROJECT);
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

  test('Register with existing email should fail', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/register')
      .set('X-Project-Name', TEST_PROJECT)
      .send(TEST_USER);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'User already exists');
  });

  test('Register with invalid data should fail', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/register')
      .set('X-Project-Name', TEST_PROJECT)
      .send({ email: 'not-an-email', password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('email must be a valid email');
  });

  test('Login with valid credentials', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/login')
      .set('X-Project-Name', TEST_PROJECT)
      .send(TEST_USER);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Login with non-existent user should fail', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/login')
      .set('X-Project-Name', TEST_PROJECT)
      .send({ email: 'no-one@example.com', password: 'password123' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  test('Login with wrong password should fail', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/login')
      .set('X-Project-Name', TEST_PROJECT)
      .send({ email: TEST_USER.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  test('Login with invalid data should fail', async () => {
    const res = await request(app)
      .post('/rest/v1/auth/login')
      .set('X-Project-Name', TEST_PROJECT)
      .send({ email: TEST_USER.email });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', '"password" is required');
  });
});
