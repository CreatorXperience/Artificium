import { Hono } from 'hono';
import { authMiddleWare } from '@org/auth';
import {
  createWorkspace,
  getAllUserWorkspace,
  getWorkspace,
  updateWorkspace,
} from '../middlewares/workspace.middleware';
const app = new Hono().basePath('/workspace');

app.get('/', authMiddleWare, getAllUserWorkspace);

app.post('/', authMiddleWare, createWorkspace);

app.get('/:id', getWorkspace);

app.patch('/:id', updateWorkspace);

app.post('/new', (c) => {
  return c.json({ messages: 'workspace created  successfully', data: {} });
});

export default app;
