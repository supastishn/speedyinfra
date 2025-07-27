const request = require('supertest');
const app = require('../app');
const { getTableDB, promisifyDBMethod } = require('../util/db');
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

  await request(app)
    .post('/rest/v1/auth/register')
    .set('X-Project-Name', TEST_PROJECT)
    .send({ email: testUserEmail, password: testUserPassword });

  const loginRes = await request(app)
    .post('/rest/v1/auth/login')
    .set('X-Project-Name', TEST_PROJECT)
    .send({ email: testUserEmail, password: testUserPassword });

  authToken = loginRes.body.token;

  const findOne = promisifyDBMethod(usersDB, 'findOne');
  const user = await findOne({ email: testUserEmail });
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
  });

  test('PUT /users/:id - should fail validation for short password', async () => {
    const res = await request(app)
      .put(`/rest/v1/users/${testUserId}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', '"password" length must be at least 6 characters long');
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
    const emailToDelete = `delete_me_${Date.now()}@example.com`;
    await request(app)
      .post('/rest/v1/auth/register')
      .set('X-Project-Name', TEST_PROJECT)
      .send({ email: emailToDelete, password: 'password123' });

    const usersDB = getTableDB('_users', TEST_PROJECT);
    const findOne = promisifyDBMethod(usersDB, 'findOne');
    const userToDelete = await findOne({ email: emailToDelete });

    const res = await request(app)
      .delete(`/rest/v1/users/${userToDelete._id}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User deleted successfully');

    const deletedUserRes = await request(app)
      .get(`/rest/v1/users/${userToDelete._id}`)
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

  describe('Authenticated User Endpoints', () => {
    test('GET /users/profile - should get authenticated user profile', async () => {
      const res = await request(app)
        .get('/rest/v1/users/profile')
        .set('X-Project-Name', TEST_PROJECT)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', testUserId);
      expect(res.body).not.toHaveProperty('password');
    });

    test('PUT /users/update - should update authenticated user', async () => {
      const newEmail = `updated_by_token_${Date.now()}@example.com`;
      const res = await request(app)
        .put('/rest/v1/users/update')
        .set('X-Project-Name', TEST_PROJECT)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: newEmail });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'User updated successfully');

      const updatedUserRes = await request(app)
        .get(`/rest/v1/users/${testUserId}`)
        .set('X-Project-Name', TEST_PROJECT)
        .set('Authorization', `Bearer ${authToken}`);
      expect(updatedUserRes.body.email).toBe(newEmail);
      testUserEmail = newEmail;
    });

    test('DELETE /users/delete - should delete authenticated user', async () => {
      const tempEmail = `temp_user_${Date.now()}@example.com`;
      const tempPassword = 'password123';
      await request(app)
        .post('/rest/v1/auth/register')
        .set('X-Project-Name', TEST_PROJECT)
        .send({ email: tempEmail, password: tempPassword });

      const loginRes = await request(app)
        .post('/rest/v1/auth/login')
        .set('X-Project-Name', TEST_PROJECT)
        .send({ email: tempEmail, password: tempPassword });
      const tempToken = loginRes.body.token;

      const res = await request(app)
        .delete('/rest/v1/users/delete')
        .set('X-Project-Name', TEST_PROJECT)
        .set('Authorization', `Bearer ${tempToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'User deleted successfully');

      const failedLoginRes = await request(app)
        .post('/rest/v1/auth/login')
        .set('X-Project-Name', TEST_PROJECT)
        .send({ email: tempEmail, password: tempPassword });
      expect(failedLoginRes.statusCode).toBe(401);
    });
  });
});
