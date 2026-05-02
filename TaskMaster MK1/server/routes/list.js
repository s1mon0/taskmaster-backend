import { Router } from 'express';
import { randomUUID } from 'crypto';
import * as listDao from '../dao/listDao.js';
import { validateDtoIn } from '../middleware/validate.js';

const router = Router();

router.get('/list', (_req, res) => {
  res.json({ itemList: listDao.list() });
});

router.post('/create', (req, res) => {
  const { error, warning } = validateDtoIn(req.body, ['name'], []);

  if (error) return res.status(400).json(error);

  const newList = { id: randomUUID(), name: req.body.name };
  listDao.create(newList);

  const response = { list: newList };
  if (warning) response.warning = warning;
  res.json(response);
});

router.post('/delete', (req, res) => {
  const { error, warning } = validateDtoIn(req.body, ['id'], []);

  if (error) return res.status(400).json(error);

  const existing = listDao.get(req.body.id);
  if (!existing) {
    return res.status(404).json({ code: 'listDoesNotExist' });
  }

  listDao.remove(req.body.id);

  const response = { success: true };
  if (warning) response.warning = warning;
  res.json(response);
});

export default router;
