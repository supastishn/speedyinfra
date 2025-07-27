const request = require('supertest');
const app = require('../app');
const { getTableDB } = require('../util/db');
const fs = require('fs');
const path = require('path');

const TEST_PROJECT = `test_project_tables_${Date.now()}`;
const TEST_TABLE = 'test_data';

let authToken;

beforeAll(async () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123'
  };

  const db = getTableDB(TEST_TABLE, TEST_PROJECT);
  await new Promise((resolve) => db.loadDatabase(resolve));

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

afterAll(async () => {
  // Cleanup project directory
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

  test('Create document with invalid data', async () => {
    const res = await request(app)
      .post(`/rest/v1/tables/${TEST_TABLE}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ invalidField: 'some value' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', '"name" is required');
  });

  test('Read documents', async () => {
    const res = await request(app)
      .get(`/rest/v1/tables/${TEST_TABLE}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('Read documents with query', async () => {
    // Create another document to test filtering
    await request(app)
      .post(`/rest/v1/tables/${TEST_TABLE}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Another Item', value: 100 });

    const res = await request(app)
      .get(`/rest/v1/tables/${TEST_TABLE}?name=Test+Item`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Test Item');
  });

  test('Update documents with query', async () => {
    const res = await request(app)
      .patch(`/rest/v1/tables/${TEST_TABLE}?name=Test+Item`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ value: 43 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('modified', 1);

    // Verify update
    const verifyRes = await request(app)
      .get(`/rest/v1/tables/${TEST_TABLE}?name=Test+Item`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(verifyRes.body[0].value).toBe(43);
  });

  test('Delete documents with query', async () => {
    const res = await request(app)
      .delete(`/rest/v1/tables/${TEST_TABLE}?name=Another+Item`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('deleted', 1);

    // Verify deletion
    const verifyRes = await request(app)
      .get(`/rest/v1/tables/${TEST_TABLE}?name=Another+Item`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(verifyRes.body.length).toBe(0);
  });

  test('Create folder for table', async () => {
    const res = await request(app)
      .post(`/rest/v1/tables/${TEST_TABLE}/_folders`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', `Folder ${TEST_TABLE} created`);

    // Verify folder exists
    const folderPath = path.join(
      __dirname,
      `../projects/${TEST_PROJECT}/_folders/${TEST_TABLE}.txt`
    );
    expect(fs.existsSync(folderPath)).toBe(true);
  });
});
