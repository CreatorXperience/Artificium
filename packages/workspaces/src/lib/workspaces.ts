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
  acceptOrRevokeJoinChannelReq,
  leaveChannel,
  updateChannel,
  leaveworkspace,
  getUserChatWithArtificium,
  getUsersChat,
  updateUserChatWithArtificium,
  updateUserChatInGroups,
  deleteChatWithArtificium,
  deleteUserChatInGroup,
  createThread,
  uploadWorkspaceImage,
  redis,
  getLoggedInUserWorkspaceMembership,
  getProjectMembership,
  joinProject,
  invitationWithLink,
  leaveProject,
  removeProjectMember,
  manageProjectRole,
  updateWorkspaceMemberRole,
  getChannelMembership,
  getChannelMembers,
  updateChannelMemberRole
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

const workspace = {
  getWorkspaceApp: () => {
    app.get('/', authMiddleWare, getAllUserWorkspace);

    app.get('/members', authMiddleWare, getWorkspaceMembers);

    app.get(
      '/membership/:workspaceId',
      authMiddleWare,
      getLoggedInUserWorkspaceMembership
    );

    app.post('/join', authMiddleWare, joinWorkspace);

    app.post('/leave', authMiddleWare, leaveworkspace);

    app.get('/:id', authMiddleWare, getWorkspace);

    app.post('/', authMiddleWare, createWorkspace);

    app.post("/admin", authMiddleWare, updateWorkspaceMemberRole)

    app.post('/upload', authMiddleWare, uploadWorkspaceImage);

    app.patch('/:id', authMiddleWare, updateWorkspace);

    app.post('/project', authMiddleWare, createNewWorkspaceProject);

    app.get('/project/membership', authMiddleWare, getProjectMembership);

    app.get('/project/join', authMiddleWare, joinProject);

    app.post('/project/role', authMiddleWare, manageProjectRole);

    app.delete('/project/me/leave', authMiddleWare, leaveProject);

    app.delete('/project/member/remove', authMiddleWare, removeProjectMember);

    app.post('/project/invitation', authMiddleWare, invitationWithLink);

    app.get('/project/:workspaceId', authMiddleWare, getAllWorskpaceProjects);

    app.patch('/project/:projectId', authMiddleWare, updateProject);

    app.get('/channel/:projectId', authMiddleWare, getAllProjectChannel);

    app.get("/channel/membership", authMiddleWare, getChannelMembership)

    app.get("/channel/members/:channelId", authMiddleWare, getChannelMembers)

    app.post('/channel', authMiddleWare, createChannel);

    app.patch('/channel/:channelId', authMiddleWare, updateChannel);

    app.patch("/channel/member/role", authMiddleWare, updateChannelMemberRole)

    app.post('/channel/join/:channelId/:userId', authMiddleWare, joinChannel);

    app.post('/channel/leave/:channelId/:userId', authMiddleWare, leaveChannel);

    app.post('/channel/request', authMiddleWare, joinChannelRequest);

    app.post(
      '/channel/request/action',
      authMiddleWare,
      acceptOrRevokeJoinChannelReq
    );


    app.get('/chat/artificium', authMiddleWare, getUserChatWithArtificium);

    app.patch('/chat/artificium', authMiddleWare, updateUserChatWithArtificium);

    app.delete('/chat/artificium', authMiddleWare, deleteChatWithArtificium);

    app.get('/chat/group', authMiddleWare, getUsersChat);

    app.patch('/chat/group', authMiddleWare, updateUserChatInGroups);

    app.delete('/chat/group', authMiddleWare, deleteUserChatInGroup);

    app.post('/chat/thread', authMiddleWare, createThread);

    app.get('/new', (c) => {
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


    return app
  },
  getRedis: () => redis
}


export default workspace;
