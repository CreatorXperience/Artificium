import { Hono } from 'hono';
import { authMiddleWare, customFormat } from '@org/auth';
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
  leaveworkspace,
  chatWithArtificium,
  getUserChatWithArtificium,
  updateUserChatWithArtificium,
  deleteChatWithArtificium,
} from '../controllers/workspace.controller';
import winston from 'winston';

winston.createLogger({
  level: 'error',
  format: customFormat,
  exceptionHandlers: [
    new winston.transports.File({ level: 'error', filename: 'error.log' }),
    new winston.transports.Console({ level: 'error' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ level: 'error', filename: 'error.log' }),
    new winston.transports.Console({ level: 'error' }),
  ],
  handleExceptions: true,
  handleRejections: true,
  transports: [
    new winston.transports.File({ level: 'error', filename: 'error.log' }),
    new winston.transports.Console({ level: 'error' }),
    new winston.transports.Console({ level: 'info' }),
  ],
});
const app = new Hono().basePath('/workspace');

app.get('/', authMiddleWare, getAllUserWorkspace);

app.get('/members', authMiddleWare, getWorkspaceMembers);

app.post('/join', authMiddleWare, joinWorkspace);

app.post('/leave', authMiddleWare, leaveworkspace);

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

app.post('/chat/artificium', authMiddleWare, chatWithArtificium);

app.get('/chat/artificium', authMiddleWare, getUserChatWithArtificium);

app.patch('/chat/artificium', authMiddleWare, updateUserChatWithArtificium);

app.delete('/chat/artificium', authMiddleWare, deleteChatWithArtificium);

app.post('/new', (c) => {
  return c.json({ messages: 'workspace created  successfully', data: {} });
});

app.onError((err, c) => {
  return c.json(
    {
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    500
  );
});
export default app;
