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
  updateChannelMemberRole,
  get_notification,
  MarkNotificationAsSeen
} from '../controllers/workspace.controller';
import { OpenAPIHono } from '@hono/zod-openapi';
import winston from 'winston';
import { swaggerUI } from '@hono/swagger-ui';
import getAllUserWorkspaceRoute from '../docs/swagger-docs/getAllUserWorkspace';
import getWorkspaceMembersRoute from '../docs/swagger-docs/getWorkspaceMembers';
import getLoggedInUserWorkspaceMembershipRoute from '../docs/swagger-docs/getLoggedUserWorkspaceMembership';
import joinWorkspaceRoute from '../docs/swagger-docs/joinWorkspace';
import leaveWorkspaceRoute from '../docs/swagger-docs/leaveWorkspace';
import getWorkspaceRoute from '../docs/swagger-docs/getWorkspace';
import createWorkspaceRoute from '../docs/swagger-docs/createWorkspace';
import updateWorkspaceMemberRoleRoute from '../docs/swagger-docs/updateWorkspaceMembershipRole';
import uploadWorkspaceImageRoute from '../docs/swagger-docs/uploadWorkspaceImage';
import updateWorkspaceRoute from '../docs/swagger-docs/updateWorkspace';
import createNewWorkspaceProjectRoute from '../docs/swagger-docs/createNewWorkspaceProject';
import getProjectMembershipRoute from '../docs/swagger-docs/getProjectMembership';
import joinProjectRoute from '../docs/swagger-docs/joinProject';
import leaveProjectRoute from '../docs/swagger-docs/leaveProject';
import removeProjectMemberRoute from '../docs/swagger-docs/removeProjectMember';
import invitationWithLinkRoute from '../docs/swagger-docs/invitationIWithLink';
import getAllWorkspaceProjectsRoute from '../docs/swagger-docs/getAllWorkspaceProjects';
import updateProjectRoute from '../docs/swagger-docs/updateProject';
import getAllProjectChannelRoute from '../docs/swagger-docs/getProjectChannel';
import getChannelMembershipRoute from '../docs/swagger-docs/getChannelMembership';
import getChannelMembersRoute from '../docs/swagger-docs/getChannelMembers';
import createChannelRoute from '../docs/swagger-docs/createChannel';
import updateChannelRoute from '../docs/swagger-docs/updateChannel';
import joinChannelRoute from '../docs/swagger-docs/joinChannel';
import joinChannelRequestRoute from '../docs/swagger-docs/joinChannelRequest';
import acceptOrRevokeJoinChannelReqRoute from '../docs/swagger-docs/acceptOrRevokeJoinChannelReq';
import getUserChatWithArtificiumRoute from '../docs/swagger-docs/getUserChatWithArtificium';
import updateUserChatWithArtificiumRoute from '../docs/swagger-docs/updateUserChatWithArtificium';
import deleteChatWithArtificiumRoute from '../docs/swagger-docs/deleteChatWithArtificium';
import getUsersChatRoute from '../docs/swagger-docs/getUserChat';
import updateUserChatInGroupsRoute from '../docs/swagger-docs/updateUserChatInGroups';
import deleteUserChatInGroupRoute from '../docs/swagger-docs/deleteUserChatInGroups';
import createThreadRoute from '../docs/swagger-docs/createThread';
import getNotificationRoute from '../docs/swagger-docs/getNotification';
import markNotificationAsSeenRoute from '../docs/swagger-docs/markNotificationAsSeen';

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
const app = new OpenAPIHono().basePath('/workspace');



app.get("/swagger", swaggerUI({ url: "/workspace/docs" }))


app.doc("/docs", {
  info: {
    title: "workspace API Documentation",
    version: "v1",
    description: ' Api documentation for workspace packages',
  }, openapi: "3.1.0"
})



if (process.env.NODE_ENV !== "development") {
  app.openapi(getAllUserWorkspaceRoute, getAllUserWorkspace as never)
  app.openapi(getWorkspaceMembersRoute, getWorkspaceMembers as never)
  app.openapi(getLoggedInUserWorkspaceMembershipRoute, getLoggedInUserWorkspaceMembership as never)
  app.openapi(joinWorkspaceRoute, joinWorkspace as never)
  app.openapi(leaveWorkspaceRoute, leaveworkspace as never)
  app.openapi(getWorkspaceRoute, getWorkspace as never)
  app.openapi(createWorkspaceRoute, createWorkspace as never)
  app.openapi(updateWorkspaceMemberRoleRoute, updateWorkspaceMemberRole as never)
  app.openapi(uploadWorkspaceImageRoute, uploadWorkspaceImage as never)
  app.openapi(updateWorkspaceRoute, updateWorkspace as never)
  app.openapi(createNewWorkspaceProjectRoute, createNewWorkspaceProject as never)
  app.openapi(getProjectMembershipRoute, getProjectMembership as never)
  app.openapi(joinProjectRoute, joinProject as never)
  app.openapi(leaveProjectRoute, leaveProject as never)
  app.openapi(removeProjectMemberRoute, removeProjectMember as never)
  app.openapi(invitationWithLinkRoute, invitationWithLink as never)
  app.openapi(getAllWorkspaceProjectsRoute, getAllWorskpaceProjects as never)
  app.openapi(updateProjectRoute, updateProject as never)
  app.openapi(getAllProjectChannelRoute, getAllProjectChannel as never)
  app.openapi(getChannelMembershipRoute, getChannelMembership as never)
  app.openapi(getChannelMembersRoute, getChannelMembers as never)
  app.openapi(createChannelRoute, createChannel as never)
  app.openapi(updateChannelRoute, updateChannel as never)
  app.openapi(joinChannelRoute, joinChannel as never)
  app.openapi(joinChannelRequestRoute, joinChannelRequest as never)
  app.openapi(acceptOrRevokeJoinChannelReqRoute, acceptOrRevokeJoinChannelReq as never)
  app.openapi(getUserChatWithArtificiumRoute, getUserChatWithArtificium as never)
  app.openapi(updateUserChatWithArtificiumRoute, updateUserChatWithArtificium as never)
  app.openapi(deleteChatWithArtificiumRoute, deleteChatWithArtificium as never)
  app.openapi(getUsersChatRoute, getUsersChat as never)
  app.openapi(updateUserChatInGroupsRoute, updateUserChatInGroups as never)
  app.openapi(deleteUserChatInGroupRoute, deleteUserChatInGroup as never)
  app.openapi(createThreadRoute, createThread as never)
  app.openapi(getNotificationRoute, get_notification as never)
  app.openapi(markNotificationAsSeenRoute, MarkNotificationAsSeen as never)

}


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

    app.post("/member/update-role", authMiddleWare, updateWorkspaceMemberRole)

    app.post('/upload', authMiddleWare, uploadWorkspaceImage);

    app.patch('/:id', authMiddleWare, updateWorkspace);

    app.post('/project', authMiddleWare, createNewWorkspaceProject);

    app.get('/project/membership', authMiddleWare, getProjectMembership);

    app.get('/project/join', authMiddleWare, joinProject);

    app.post('/project/role', authMiddleWare, manageProjectRole);   // Modify this endpoint logic before creating swagger docs

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

    app.post('/channel/join/:channelId/:projectMemberId', authMiddleWare, joinChannel);

    app.delete('/channel/leave/:channelId/:projectMemberId/:channelMemberId', authMiddleWare, leaveChannel);

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

    app.get("/notifications", authMiddleWare, get_notification)

    app.patch("/notification/:notificationId", authMiddleWare, MarkNotificationAsSeen)

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
