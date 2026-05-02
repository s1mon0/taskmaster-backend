import request from 'supertest';
import express from 'express';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// --- Izolované testovací datové soubory ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DATA_DIR = join(__dirname, '../data-test');

process.env.DATA_DIR = TEST_DATA_DIR;

// Musíme importovat routery AŽ PO nastavení DATA_DIR
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

describe('GET /list/list', () => {
  beforeEach(resetData);

  test('vrátí prázdný itemList', async () => {
    const res = await request(buildApp()).get('/list/list');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ itemList: [] });
  });
});

describe('POST /list/create', () => {
  beforeEach(resetData);

  test('vytvoří seznam', async () => {
    const res = await request(buildApp())
      .post('/list/create')
      .send({ name: 'Nakupování' });
    expect(res.status).toBe(200);
    expect(res.body.list).toMatchObject({ name: 'Nakupování' });
    expect(res.body.list.id).toBeTruthy();
  });

  test('chybí name → invalidDtoIn', async () => {
    const res = await request(buildApp()).post('/list/create').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalidDtoIn');
  });

  test('přebytečné klíče → warning unsupportedKeys', async () => {
    const res = await request(buildApp())
      .post('/list/create')
      .send({ name: 'Test', extra: 'nope' });
    expect(res.status).toBe(200);
    expect(res.body.warning).toMatchObject({ warning: 'unsupportedKeys', keys: ['extra'] });
  });
});

describe('POST /list/delete', () => {
  beforeEach(resetData);

  test('smaže existující seznam', async () => {
    const app = buildApp();
    const created = await request(app).post('/list/create').send({ name: 'Temp' });
    const { id } = created.body.list;

    const res = await request(app).post('/list/delete').send({ id });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test('chybí id → invalidDtoIn', async () => {
    const res = await request(buildApp()).post('/list/delete').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('invalidDtoIn');
  });

  test('neexistující id → listDoesNotExist', async () => {
    const res = await request(buildApp())
      .post('/list/delete')
      .send({ id: 'neexistujici-id' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('listDoesNotExist');
  });

  test('kaskádové smazání úkolů při smazání listu', async () => {
    const app = buildApp();
    const listRes = await request(app).post('/list/create').send({ name: 'Kaskáda' });
    const listId = listRes.body.list.id;

    await request(app).post('/task/create').send({ listId, text: 'Úkol 1' });
    await request(app).post('/task/create').send({ listId, text: 'Úkol 2' });

    await request(app).post('/list/delete').send({ id: listId });

    // Seznam je pryč
    const listCheck = await request(app).get('/list/list');
    expect(listCheck.body.itemList.find(l => l.id === listId)).toBeUndefined();

    // Úkoly jsou pryč (jiný list ověříme přes nový list)
    const newList = await request(app).post('/list/create').send({ name: 'Nový' });
    const tasksRes = await request(app).get(`/task/list?listId=${newList.body.list.id}`);
    expect(tasksRes.body.itemList).toHaveLength(0);
  });
});
