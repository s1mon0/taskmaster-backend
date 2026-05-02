import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function dataPath() {
  const dir = process.env.DATA_DIR ?? join(__dirname, '../../data');
  return join(dir, 'tasks.json');
}

function readTasks() {
  return JSON.parse(readFileSync(dataPath(), 'utf-8'));
}

function writeTasks(tasks) {
  writeFileSync(dataPath(), JSON.stringify(tasks, null, 2));
}

export function list() {
  return readTasks();
}

export function listByListId(listId) {
  return readTasks().filter(t => t.listId === listId);
}

export function get(id) {
  return readTasks().find(t => t.id === id) ?? null;
}

export function create(task) {
  const tasks = readTasks();
  tasks.push(task);
  writeTasks(tasks);
  return task;
}

export function update(updatedTask) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === updatedTask.id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updatedTask };
  writeTasks(tasks);
  return tasks[idx];
}

export function remove(id) {
  const tasks = readTasks();
  writeTasks(tasks.filter(t => t.id !== id));
}

export function removeByListId(listId) {
  const tasks = readTasks();
  writeTasks(tasks.filter(t => t.listId !== listId));
}
