import { Hono } from 'hono';
import { authMiddleWare } from '@org/auth';
import {
  createWorkspace,
  getAllUserWorkspace,
  getWorkspace,
  getWorkspaceMembers,
  joinWorkspace,
  updateWorkspace,
} from '../middlewares/workspace.middleware';
const app = new Hono().basePath('/workspace');

app.get('/', authMiddleWare, getAllUserWorkspace);

app.get('/members', authMiddleWare, getWorkspaceMembers);

app.post('/members', authMiddleWare, joinWorkspace);

app.get('/:id', authMiddleWare, getWorkspace);

app.post('/', authMiddleWare, createWorkspace);

app.patch('/:id', authMiddleWare, updateWorkspace);

app.post('/new', (c) => {
  return c.json({ messages: 'workspace created  successfully', data: {} });
});

export default app;
