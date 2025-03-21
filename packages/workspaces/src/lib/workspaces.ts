import { Hono } from 'hono';
import { authMiddleWare } from '@org/auth';
import {
  createChannel,
  createNewWorkspaceProject,
  createWorkspace,
  getAllProjectChannel,
  getAllUserWorkspace,
  getAllWorskpaceProjects,
  getWorkspace,
  getWorkspaceMembers,
  joinChannel,
  joinWorkspace,
  updateProject,
  updateWorkspace,
  joinChannelRequest,
  acceptOrRevokeChannelReq,
  leaveChannel,
  updateChannel,
} from '../controllers/workspace.middleware';
const app = new Hono().basePath('/workspace');

app.get('/', authMiddleWare, getAllUserWorkspace);

app.get('/members', authMiddleWare, getWorkspaceMembers);

app.post('/members', authMiddleWare, joinWorkspace);

app.get('/:id', authMiddleWare, getWorkspace);

app.post('/', authMiddleWare, createWorkspace);

app.patch('/:id', authMiddleWare, updateWorkspace);

app.get('/project/:workspaceId', authMiddleWare, getAllWorskpaceProjects);

app.post('/project', authMiddleWare, createNewWorkspaceProject);

app.patch('/project/:projectId', authMiddleWare, updateProject);

app.get('/channel/:projectId', authMiddleWare, getAllProjectChannel);

app.post('/channel', authMiddleWare, createChannel);

app.patch('/channel/:channelId', authMiddleWare, updateChannel);

app.post('/channel/join/:channelId/:userId', authMiddleWare, joinChannel);

app.post('/channel/leave/:channelId/:userId', authMiddleWare, leaveChannel);

app.post('/channel/request', authMiddleWare, joinChannelRequest);

app.post('/channel/request/action', authMiddleWare, acceptOrRevokeChannelReq);

app.post('/new', (c) => {
  return c.json({ messages: 'workspace created  successfully', data: {} });
});

export default app;
