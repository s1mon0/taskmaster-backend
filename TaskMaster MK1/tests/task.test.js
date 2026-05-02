import request from 'supertest';
import express from 'express';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DATA_DIR = join(__dirname, '../data-test');

process.env.DATA_DIR = TEST_DATA_DIR;

const { default: listRouter } = await import('../server/routes/list.js');
const { default: taskRouter } = await import('../server/routes/task.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/list', listRouter);
  app.use('/task', taskRouter);
  return app;
}

function resetData() {
  mkdirSync(TEST_DATA_DIR, { recursive: true });
  writeFileSync(join(TEST_DATA_DIR, 'lists.json'), '[]');
  writeFileSync(join(TEST_DATA_DIR, 'tasks.json'), '[]');
}

afterAll(() => {
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

// Pomocná funkce – vytvoří list a vrátí jeho id
async function createList(app, name = 'Testovací seznam') {
  const res = await request(app).post('/list/create').send({ name });
  return res.body.list.id;
}

describe('GET /task/list', () => {
  beforeEach(resetData);

  test('vrátí prázdný itemList pro existující list', async () => {
    const app = buildApp();
    const listId = await createList(app);
    const res = await request(app).get(`/task/list?listId=${listId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ itemList: [] });
  });

  test('chybí listId → invalidDtoIn', async () => {
    const res = await request(buildApp()).get('/task/list');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalidDtoIn');
  });

  test('neexistující listId → listDoesNotExist', async () => {
    const res = await request(buildApp()).get('/task/list?listId=nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('listDoesNotExist');
  });
});

describe('POST /task/create', () => {
  beforeEach(resetData);

  test('vytvoří task', async () => {
    const app = buildApp();
    const listId = await createList(app);
    const res = await request(app).post('/task/create').send({ listId, text: 'Koupit mléko' });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({
      listId,
      text: 'Koupit mléko',
      isCompleted: false,
    });
    expect(res.body.task.id).toBeTruthy();
  });

  test('chybí listId → invalidDtoIn', async () => {
    const res = await request(buildApp()).post('/task/create').send({ text: 'Úkol' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalidDtoIn');
  });

  test('chybí text → invalidDtoIn', async () => {
    const res = await request(buildApp()).post('/task/create').send({ listId: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalidDtoIn');
  });

  test('neexistující listId → listDoesNotExist', async () => {
    const res = await request(buildApp())
      .post('/task/create')
      .send({ listId: 'neexistuje', text: 'Test' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('listDoesNotExist');
  });

  test('přebytečné klíče → warning unsupportedKeys', async () => {
    const app = buildApp();
    const listId = await createList(app);
    const res = await request(app)
      .post('/task/create')
      .send({ listId, text: 'Úkol', priority: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.warning).toMatchObject({ warning: 'unsupportedKeys', keys: ['priority'] });
  });
});

describe('POST /task/update', () => {
  beforeEach(resetData);

  test('aktualizuje isCompleted', async () => {
    const app = buildApp();
    const listId = await createList(app);
    const taskRes = await request(app).post('/task/create').send({ listId, text: 'Nakoupit' });
    const taskId = taskRes.body.task.id;

    const res = await request(app).post('/task/update').send({ id: taskId, isCompleted: true });
    expect(res.status).toBe(200);
    expect(res.body.task.isCompleted).toBe(true);
    expect(res.body.task.id).toBe(taskId);
  });

  test('chybí id → invalidDtoIn', async () => {
    const res = await request(buildApp()).post('/task/update').send({ isCompleted: true });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalidDtoIn');
  });

  test('chybí isCompleted → invalidDtoIn', async () => {
    const res = await request(buildApp()).post('/task/update').send({ id: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalidDtoIn');
  });

  test('neexistující task → taskDoesNotExist', async () => {
    const res = await request(buildApp())
      .post('/task/update')
      .send({ id: 'neexistuje', isCompleted: false });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('taskDoesNotExist');
  });
});
