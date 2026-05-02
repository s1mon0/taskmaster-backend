import { Router } from 'express';
import { randomUUID } from 'crypto';
import * as taskDao from '../dao/taskDao.js';
import * as listDao from '../dao/listDao.js';
import { validateDtoIn } from '../middleware/validate.js';

const router = Router();

router.get('/list', (req, res) => {
  const { error, warning } = validateDtoIn(req.query, ['listId'], []);

  if (error) return res.status(400).json(error);

  const list = listDao.get(req.query.listId);
  if (!list) {
    return res.status(404).json({ code: 'listDoesNotExist' });
  }

  const response = { itemList: taskDao.listByListId(req.query.listId) };
  if (warning) response.warning = warning;
  res.json(response);
});

router.post('/create', (req, res) => {
  const { error, warning } = validateDtoIn(req.body, ['listId', 'text'], []);

  if (error) return res.status(400).json(error);

  const list = listDao.get(req.body.listId);
  if (!list) {
    return res.status(404).json({ code: 'listDoesNotExist' });
  }

  const newTask = {
    id: randomUUID(),
    listId: req.body.listId,
    text: req.body.text,
    isCompleted: false,
  };
  taskDao.create(newTask);

  const response = { task: newTask };
  if (warning) response.warning = warning;
  res.json(response);
});

router.post('/update', (req, res) => {
  const { error, warning } = validateDtoIn(req.body, ['id', 'isCompleted'], []);

  if (error) return res.status(400).json(error);

  const existing = taskDao.get(req.body.id);
  if (!existing) {
    return res.status(404).json({ code: 'taskDoesNotExist' });
  }

  const updated = taskDao.update({ id: req.body.id, isCompleted: req.body.isCompleted });

  const response = { task: updated };
  if (warning) response.warning = warning;
  res.json(response);
});

export default router;
