const request = require('supertest');
const app = require('../app');
const { getTableDB } = require('../util/db');
const fs = require('fs');
const path = require('path');

jest.setTimeout(15000);

const TEST_PROJECT = `test_project_users_${Date.now()}`;
let authToken;
let testUserId;
let testUserEmail;

beforeAll(async () => {
  testUserEmail = `testuser_${Date.now()}@example.com`;
  const testUserPassword = 'password123';

  const usersDB = getTableDB('_users', TEST_PROJECT);

  // Register a user
  await request(app)
    .post('/rest/v1/auth/register')
    .set('X-Project-Name', TEST_PROJECT)
    .send({ email: testUserEmail, password: testUserPassword });

  // Login to get token and user ID
  const loginRes = await request(app)
    .post('/rest/v1/auth/login')
    .set('X-Project-Name', TEST_PROJECT)
    .send({ email: testUserEmail, password: testUserPassword });
    
  authToken = loginRes.body.token;
  
  // Fetch the user to get their _id
  const user = await new Promise((resolve, reject) => {
    usersDB.findOne({ email: testUserEmail }, (err, doc) => {
      if (err) reject(err);
      else resolve(doc);
    });
  });
  testUserId = user._id;
});

afterAll(async () => {
  const projectPath = path.join(__dirname, `../projects/${TEST_PROJECT}`);
  if (fs.existsSync(projectPath)) {
    await require('fs').promises.rm(projectPath, { recursive: true });
  }
});

describe('User API', () => {
  test('GET /users/:id - should get user by ID', async () => {
    const res = await request(app)
      .get(`/rest/v1/users/${testUserId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', testUserEmail);
    expect(res.body).not.toHaveProperty('password');
  });

  test('GET /users/:id - should return 404 if user not found', async () => {
    const nonExistentId = 'nonexistentid123';
    const res = await request(app)
      .get(`/rest/v1/users/${nonExistentId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });

  test('PUT /users/:id - should update user email', async () => {
    const newEmail = `updated_${Date.now()}@example.com`;
    const res = await request(app)
      .put(`/rest/v1/users/${testUserId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: newEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User updated successfully');

    // Verify the update by fetching the user again
    const updatedUserRes = await request(app)
      .get(`/rest/v1/users/${testUserId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);
    expect(updatedUserRes.body).toHaveProperty('email', newEmail);
  });

  test('PUT /users/:id - should update user password', async () => {
    const newPassword = 'newpassword123';
    const res = await request(app)
      .put(`/rest/v1/users/${testUserId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ password: newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User updated successfully');
    // Note: Cannot directly verify password update due to hashing, but the API should confirm success.
  });

  test('PUT /users/:id - should return 404 if user not found during update', async () => {
    const nonExistentId = 'nonexistentid123';
    const res = await request(app)
      .put(`/rest/v1/users/${nonExistentId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: `another_${Date.now()}@example.com` });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });

  test('DELETE /users/:id - should delete user by ID', async () => {
    const res = await request(app)
      .delete(`/rest/v1/users/${testUserId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User deleted successfully');

    // Verify deletion by trying to get the user again
    const deletedUserRes = await request(app)
      .get(`/rest/v1/users/${testUserId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);
    expect(deletedUserRes.statusCode).toBe(404);
  });

  test('DELETE /users/:id - should return 404 if user not found during delete', async () => {
    const nonExistentId = 'nonexistentid123';
    const res = await request(app)
      .delete(`/rest/v1/users/${nonExistentId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });
});
