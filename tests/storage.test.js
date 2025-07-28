const request = require('supertest');
const app = require('../app');
const fs = require('fs');
const path = require('path');

const TEST_PROJECT = `test_project_storage_${Date.now()}`;
let authToken;

beforeAll(async () => {
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

afterAll(() => {
  const projectPath = path.join(__dirname, `../projects/${TEST_PROJECT}`);
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

describe('Storage API', () => {
  let uploadedFilename;

  test('POST /storage/upload - should upload a file', async () => {
    const filePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(filePath, 'this is a test file');

    const res = await request(app)
      .post('/rest/v1/storage/upload')
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('files', filePath);

    fs.unlinkSync(filePath);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Files uploaded successfully');
    expect(res.body.files).toBeInstanceOf(Array);
    expect(res.body.files.length).toBe(1);
    expect(res.body.files[0].originalname).toBe('test-file.txt');
    uploadedFilename = res.body.files[0].filename;
  });

  test('GET /storage/files - should list uploaded files', async () => {
    const res = await request(app)
      .get('/rest/v1/storage/files')
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body).toContain(uploadedFilename);
  });

  test('GET /storage/files/:filename - should download a file', async () => {
    const res = await request(app)
      .get(`/rest/v1/storage/files/${uploadedFilename}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toContain(uploadedFilename);
    expect(res.text).toBe('this is a test file');
  });

  test('DELETE /storage/files/:filename - should delete a file', async () => {
    const res = await request(app)
      .delete(`/rest/v1/storage/files/${uploadedFilename}`)
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('File deleted successfully');
  });

  test('GET /storage/files - should reflect deletion in file list', async () => {
    const res = await request(app)
      .get('/rest/v1/storage/files')
      .set('X-Project-Name', TEST_PROJECT)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain(uploadedFilename);
  });
});
