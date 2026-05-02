import express from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// In-memory úložiště
let lists = [];
let tasks = [];

// --- LIST ENDPOINTY ---

// GET /list/list -> vrátí { itemList: lists }
app.get('/list/list', (req, res) => {
  res.json({ itemList: lists });
});

// POST /list/create -> přijme { name }, vytvoří seznam, uloží do pole lists a vrátí { list: novySeznam }
app.post('/list/create', (req, res) => {
  const { name } = req.body;
  const newList = {
    id: Date.now().toString(),
    name: name,
    created_at: new Date().toISOString()
  };
  lists.push(newList);
  res.json({ list: newList });
});

// POST /list/delete -> přijme { id }, smaže seznam a všechny úkoly s daným listId. Vrátí { success: true }.
app.post('/list/delete', (req, res) => {
  const { id } = req.body;
  lists = lists.filter(l => l.id !== id);
  tasks = tasks.filter(t => t.listId !== id);
  res.json({ success: true });
});

// --- TASK ENDPOINTY ---

// GET /task/list -> přečte listId z query, vrátí úkoly jen pro tento seznam jako { itemList: vyfiltrovaneTasks }.
app.get('/task/list', (req, res) => {
  const { listId } = req.query;
  const filteredTasks = tasks.filter(t => t.listId === listId);
  res.json({ itemList: filteredTasks });
});

// POST /task/create -> přijme { listId, text }, přidá isCompleted: false, uloží do tasks a vrátí { task: novyUkol }.
app.post('/task/create', (req, res) => {
  const { listId, text } = req.body;
  const newTask = {
    id: Date.now().toString(),
    listId,
    text,
    isCompleted: false,
    created_at: new Date().toISOString()
  };
  tasks.push(newTask);
  res.json({ task: newTask });
});

// POST /task/update -> přijme { id, isCompleted }, najde úkol, upraví stav a vrátí { task: upravenyUkol }.
app.post('/task/update', (req, res) => {
  const { id, isCompleted } = req.body;
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex !== -1) {
    tasks[taskIndex].isCompleted = isCompleted;
    res.json({ task: tasks[taskIndex] });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.listen(port, () => {
  console.log(`Backend server běží na http://localhost:${port}`);
});
