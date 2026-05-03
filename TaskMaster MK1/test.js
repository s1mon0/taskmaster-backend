// Jednoduchý integrační test bez externích závislostí
// Spusť server (node server.js) a pak: node test.js

const BASE = 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json() };
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ' → ' + detail : ''}`);
    failed++;
  }
}

// ─────────────────────────────────────────────
console.log('\n📋 BLOK 1: GET /list/list');
{
  const r = await get('/list/list');
  assert('Status 200', r.status === 200, `got ${r.status}`);
  assert('itemList je pole', Array.isArray(r.body.itemList));
}

// ─────────────────────────────────────────────
console.log('\n📋 BLOK 2: POST /list/create');
{
  // Chybí name → invalidDtoIn
  const r1 = await post('/list/create', {});
  assert('Chybí name → status 400', r1.status === 400, `got ${r1.status}`);
  assert('Chybí name → code invalidDtoIn', r1.body.code === 'invalidDtoIn', JSON.stringify(r1.body));

  // Přebytečný klíč → warning unsupportedKeys
  const r2 = await post('/list/create', { name: 'Testovaci seznam', extra: 'nope' });
  assert('Warning unsupportedKeys', r2.body.warning?.warning === 'unsupportedKeys', JSON.stringify(r2.body));
  assert('Warning obsahuje klic extra', r2.body.warning?.keys?.includes('extra'));

  // Úspěšné vytvoření
  const r3 = await post('/list/create', { name: 'Nakupování' });
  assert('Vytvoření listu → status 200', r3.status === 200, `got ${r3.status}`);
  assert('Odpověď obsahuje list.name', r3.body.list?.name === 'Nakupování', JSON.stringify(r3.body));
  assert('Odpověď obsahuje list.id', typeof r3.body.list?.id === 'string');
}

// ─────────────────────────────────────────────
console.log('\n📋 BLOK 3: GET /task/list');
{
  // Nejdřív vytvoříme list pro testy tasků
  const listRes = await post('/list/create', { name: 'Task test list' });
  const listId = listRes.body.list.id;

  // Chybí listId
  const r1 = await get('/task/list');
  assert('Chybí listId → status 400', r1.status === 400, `got ${r1.status}`);
  assert('Chybí listId → code invalidDtoIn', r1.body.code === 'invalidDtoIn');

  // Neexistující listId
  const r2 = await get('/task/list?listId=neexistuje-123');
  assert('Neexistující listId → status 404', r2.status === 404, `got ${r2.status}`);
  assert('Neexistující listId → code listDoesNotExist', r2.body.code === 'listDoesNotExist');

  // Existující list, zatím prázdný
  const r3 = await get(`/task/list?listId=${listId}`);
  assert('Existující list → status 200', r3.status === 200);
  assert('Existující list → prázdný itemList', Array.isArray(r3.body.itemList) && r3.body.itemList.length === 0);
}

// ─────────────────────────────────────────────
console.log('\n📋 BLOK 4: POST /task/create');
{
  const listRes = await post('/list/create', { name: 'Task create test' });
  const listId = listRes.body.list.id;

  // Chybí listId
  const r1 = await post('/task/create', { text: 'Koupit mléko' });
  assert('Chybí listId → status 400', r1.status === 400);
  assert('Chybí listId → invalidDtoIn', r1.body.code === 'invalidDtoIn');

  // Chybí text
  const r2 = await post('/task/create', { listId });
  assert('Chybí text → status 400', r2.status === 400);
  assert('Chybí text → invalidDtoIn', r2.body.code === 'invalidDtoIn');

  // Neexistující list
  const r3 = await post('/task/create', { listId: 'nope', text: 'Test' });
  assert('Neexistující listId → listDoesNotExist', r3.body.code === 'listDoesNotExist');

  // Úspěch
  const r4 = await post('/task/create', { listId, text: 'Koupit mléko' });
  assert('Vytvoření tasku → status 200', r4.status === 200);
  assert('Task má správný listId', r4.body.task?.listId === listId);
  assert('Task má isCompleted: false', r4.body.task?.isCompleted === false);
  assert('Task má text', r4.body.task?.text === 'Koupit mléko');
  assert('Task má id', typeof r4.body.task?.id === 'string');
}

// ─────────────────────────────────────────────
console.log('\n📋 BLOK 5: POST /task/update');
{
  const listRes = await post('/list/create', { name: 'Update test' });
  const listId = listRes.body.list.id;
  const taskRes = await post('/task/create', { listId, text: 'Splnit úkol' });
  const taskId = taskRes.body.task.id;

  // Chybí id
  const r1 = await post('/task/update', { isCompleted: true });
  assert('Chybí id → invalidDtoIn', r1.body.code === 'invalidDtoIn');

  // Chybí isCompleted
  const r2 = await post('/task/update', { id: taskId });
  assert('Chybí isCompleted → invalidDtoIn', r2.body.code === 'invalidDtoIn');

  // Neexistující task
  const r3 = await post('/task/update', { id: 'neexistuje', isCompleted: true });
  assert('Neexistující task → taskDoesNotExist', r3.body.code === 'taskDoesNotExist');

  // Úspěch — toggle na true
  const r4 = await post('/task/update', { id: taskId, isCompleted: true });
  assert('Update → status 200', r4.status === 200);
  assert('Update → isCompleted je true', r4.body.task?.isCompleted === true);

  // Toggle zpět na false
  const r5 = await post('/task/update', { id: taskId, isCompleted: false });
  assert('Toggle zpět → isCompleted je false', r5.body.task?.isCompleted === false);
}

// ─────────────────────────────────────────────
console.log('\n📋 BLOK 6: POST /list/delete + KASKÁDOVÉ SMAZÁNÍ');
{
  // Vytvoříme list a přidáme 2 úkoly
  const listRes = await post('/list/create', { name: 'Kaskáda test' });
  const listId = listRes.body.list.id;
  await post('/task/create', { listId, text: 'Úkol 1' });
  await post('/task/create', { listId, text: 'Úkol 2' });

  // Ověříme, že úkoly existují
  const beforeDelete = await get(`/task/list?listId=${listId}`);
  assert('Před smazáním → 2 úkoly', beforeDelete.body.itemList?.length === 2);

  // Chybí id
  const r1 = await post('/list/delete', {});
  assert('Chybí id → invalidDtoIn', r1.body.code === 'invalidDtoIn');

  // Neexistující id
  const r2 = await post('/list/delete', { id: 'nope' });
  assert('Neexistující id → listDoesNotExist', r2.body.code === 'listDoesNotExist');

  // Smazání
  const r3 = await post('/list/delete', { id: listId });
  assert('Smazání → status 200', r3.status === 200);
  assert('Smazání → success: true', r3.body.success === true);

  // Ověření kaskády: seznam není v /list/list
  const listCheck = await get('/list/list');
  const stillExists = listCheck.body.itemList?.some(l => l.id === listId);
  assert('Kaskáda → seznam smazán z lists.json', !stillExists);

  // Ověření kaskády: tasks.json — dotaz na smazaný listId vrátí listDoesNotExist
  const taskCheck = await get(`/task/list?listId=${listId}`);
  assert('Kaskáda → /task/list vrátí listDoesNotExist', taskCheck.body.code === 'listDoesNotExist');
}

// ─────────────────────────────────────────────
console.log(`\n${'─'.repeat(45)}`);
console.log(`Výsledek: ${passed} ✅ prošlo  |  ${failed} ❌ selhalo`);
if (failed === 0) {
  console.log('🎉 Všechny testy prošly!\n');
} else {
  console.log('⚠️  Některé testy selhaly — viz výpis výše.\n');
  process.exit(1);
}
