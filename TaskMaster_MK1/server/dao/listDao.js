import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { removeByListId } from './taskDao.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function dataPath() {
  const dir = process.env.DATA_DIR ?? join(__dirname, '../../data');
  return join(dir, 'lists.json');
}

function readLists() {
  return JSON.parse(readFileSync(dataPath(), 'utf-8'));
}

function writeLists(lists) {
  writeFileSync(dataPath(), JSON.stringify(lists, null, 2));
}

export function list() {
  return readLists();
}

export function get(id) {
  return readLists().find(l => l.id === id) ?? null;
}

export function create(listData) {
  const lists = readLists();
  lists.push(listData);
  writeLists(lists);
  return listData;
}

export function remove(id) {
  const lists = readLists();
  writeLists(lists.filter(l => l.id !== id));
  // Kaskádové smazání všech úkolů patřících do tohoto listu
  removeByListId(id);
}
