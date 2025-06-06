import {
  TCreateWorkspace,
  workspaceValidator,
  updateWorkspaceValidator,
  projectValidator,
  TProject,
  projectUpdateValidator,
  channelValidator,
  channelUpdateValidator,
  channelReqValidator,
  acceptOrRejectReqValidator,
  artificiumMessagePayloadValidator,
  Redis,
  updateArtificiumMessagePayloadSchema,
  deleteArtificiumMessageValidator,
  validateImageUpdateSchema,
  integration,
  projectMemberValidator,
  projectRoleValidator,
} from '@org/database';
import { PrismaClient } from '@prisma/client';
import { Context } from 'hono';
import { ObjectId } from 'mongodb';
import logger from '../../utils/logger';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { google } from 'googleapis';
import EventEmitter from 'node:events';
import { memoryStorage } from 'multer';

const redis = new Redis();

const MAX_CACHE_SIZE = 2;

redis
  .connect()
  .then(() => {
    logger.log({ level: 'info', message: 'connected to redis successfully' });
  })
  .catch(() => {
    logger.log('error', 'encountered an error while connecting to redis');
  });

const prisma = new PrismaClient();

class CustomEmitter extends EventEmitter {}

const customEmitter = new CustomEmitter();

const getAllUserWorkspace = async (c: Context) => {
  const userId = c.var.getUser().id;
  const publicWorkspace = await prisma.workspace.findMany({
    take: 20,
    where: { visibility: false, NOT: { members: { has: userId } } },
  });

  const personalWorkspaces = await prisma.workspace.findMany({
    where: { members: { has: userId } },
  });

  return c.json({
    messages: 'success',
    data: { personalWorkspaces, publicWorkspace },
  });
};

const getWorkspace = async (c: Context) => {
  const id = c.req.param('id');
  const workspace = await prisma.workspace.findUnique({ where: { id } });

  c.status(200);
  return c.json({ messages: 'success', data: workspace });
};

const createWorkspace = async (c: Context) => {
  const body = (await c.req.json()) as TCreateWorkspace;
  const owner = c.var.getUser().id;
  const data = workspaceValidator(body) as any;
  const workspaceID = new ObjectId().toHexString();
  if (data.error) {
    c.status(400);
    return c.json({
      message: `Validation Error: ${data.error.errors[0].message}`,
      status: 400,
    });
  }

  const existing_workspace = await prisma.workspace.findUnique({
    where: { name: data.data.name },
  });
  if (existing_workspace) {
    c.status(401);
    return c.json({ message: 'workspace with the same name already exist' });
  }
  const user = c.var.getUser();

  const newMember = await prisma.workspaceMember.create({
    data: {
      email: user.email,
      image: user.image,
      name: `${user.firstname} ${user.lastname}`,
      userId: owner,
      workspaceId: workspaceID,
    },
  });

  const workspaceObj = {
    ...data.data,
    owner,
    id: workspaceID,
    url: `http://localhost:3030/workspace/${workspaceID}`,
    totalMembers: 1,
    workspaceAdmin: [owner],
    members: [newMember.id],
    readAccess: [owner],
    writeAccess: [owner],
  };

  const workspace = await prisma.workspace.create({
    data: {
      ...workspaceObj,
    },
  });

  return c.json({ messages: 'workspace created', data: workspace });
};

const updateWorkspace = async (c: Context) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const data = updateWorkspaceValidator(body);
  if (data.error) {
    c.status(400);
    return c.json({
      message: `Validation Error:  ${data.error.errors[0].message}`,
    });
  }
  const updatedWorkspace = await prisma.workspace.update({
    where: { id },
    data: {
      ...data.data,
    },
  });
  return c.json({
    message: `workspace ${id} updated successfully`,
    data: updatedWorkspace,
  });
};

const getWorkspaceMembers = async (c: Context) => {
  const workspaceId = c.req.query('workspaceId');
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspaceId },
  });

  return c.json({ message: 'success', data: workspaceMembers });
};

// test this code below
const getLoggedInUserWorkspaceMembership = async (c: Context) => {
  const userID = c.var.getUser().id;
  const workspaceID = c.req.param().workspaceId;
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: userID, workspaceId: workspaceID },
  });
  if (!member) {
    return c.json({ message: 'membership not found' }, 404);
  }
  return c.json({ message: 'membership retrieved successfully', data: member });
};

const joinWorkspace = async (c: Context) => {
  const workspaceId = c.req.query('workspaceId');
  const userID = c.var.getUser().id;
  if (!workspaceId) {
    c.status(400);
    return c.json({ message: 'incomplete query param' });
  }
  if (!ObjectId.isValid(workspaceId)) {
    c.status(400);
    return c.json({ message: 'empty or bad workspace Id' });
  }
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: userID, workspaceId: workspaceId },
  });
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    c.status(404);
    return c.json({ message: 'workspace not found' });
  }
  if (member) {
    c.status(201);
    return c.json({ message: 'user is already a member of this workspace' });
  }

  const user = c.var.getUser();
  const newMember = await prisma.workspaceMember.create({
    data: {
      email: user.email,
      image: user.image,
      name: `${user.firstname} ${user.lastname}`,
      userId: userID,
      workspaceId: workspaceId,
    },
  });

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { members: [...workspace.members, newMember.id] },
  });

  return c.json({
    message: 'your are now a member of this workspace',
    data: updatedWorkspace,
  });
};

// test this code below !
const leaveworkspace = async (c: Context) => {
  const workspaceId = c.req.query('workspaceId');
  const userID =
    (c.req.query('userId') as string) || (c.var.getUser().id as string);

  if (!workspaceId) {
    c.status(400);
    return c.json({ message: 'empty or bad workspace Id' });
  }
  if (!ObjectId.isValid(workspaceId)) {
    c.status(400);
    return c.json({ message: 'empty or bad workspace Id' });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    c.status(404);
    return c.json({ message: 'workspace not found, Bad workspaceId' });
  }

  const user = await prisma.user.findUnique({ where: { id: userID } });

  if (!user) {
    c.status(404);
    return c.json({ message: 'user not found, Bad user ID' });
  }

  const filteredMembers = workspace.members.filter((item) => item !== userID);

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { members: filteredMembers },
  });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: workspace.id },
  });

  await prisma.workspaceMember.delete({
    where: { id: member.id, workspaceId: workspace.id, userId: userID },
  });

  return c.json({ message: 'successfully removed user from  workspace' });
};

const getAllWorskpaceProjects = async (c: Context) => {
  const workspaceId = c.req.param('workspaceId');
  if (!workspaceId) {
    c.status(400);
    return c.json({ message: 'invalid or empty workspace ID' });
  }

  if (!ObjectId.isValid(workspaceId)) {
    c.status(400);
    return c.json({ message: 'invalid or empty workspace ID' });
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
  });

  return c.json({
    messages: 'success',
    data: projects,
  });
};

//test this code below !
const createNewWorkspaceProject = async (c: Context) => {
  const { id } = c.var.getUser();
  const body: TProject = await c.req.json();
  const data = projectValidator(body);
  if (data.error) {
    c.status(400);
    return c.json({
      message: `Validation error: ${data.error.errors[0].message}`,
    });
  }

  if (!ObjectId.isValid(data.data.workspaceId)) {
    c.status(400);
    return c.json({ message: 'Malformed Object Id' });
  }
  const workspace = await prisma.workspace.findUnique({
    where: { id: data.data.workspaceId },
  });
  if (!workspace) {
    c.status(404);
    return c.json({ message: 'No workspace is attached to this object Id' });
  }

  const hexID = new ObjectId().toHexString();

  const workspace_membership_id: Array<string> = [];
  if (data.data.members) {
    for await (const member of data.data.members) {
      const { name, email, image, memberId, workspaceId, userId } = member;
      workspace_membership_id.push(memberId);
      await prisma.projectMember.create({
        data: {
          image,
          name,
          projectId: hexID,
          memberId: memberId,
          workspaceId,
          email,
          userId,
        },
      });
    }
  }

  const projectObj = { ...data.data };
  delete projectObj.members;
  const projectObjWithoutMembers: Omit<TProject, 'members'> = projectObj;
  const project = await prisma.project.create({
    data: {
      id: hexID,
      members: workspace_membership_id,
      creator: id,
      ...projectObjWithoutMembers,
    },
  });
  return c.json({ message: 'project successfully created', data: project });
};

//test this code below !
const getProjectMembership = async (c: Context) => {
  const param = c.req.param();
  const workspaceId = param.workspaceId;
  const projectId = param.projectId;
  const memberId = param.memberId;
  const workspaceMembership = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!workspaceMembership) {
    return c.json({ message: 'membership not found' }, 404);
  }
  const projectMembership = await prisma.projectMember.findFirst({
    where: {
      workspaceId,
      projectId,
      memberId,
    },
  });
  return c.json({
    message: 'project membership retrieved successfully',
    data: projectMembership,
  });
};

// TODO: GET  USER controller

//test this code below !
const joinProject = async (c: Context) => {
  const userId = c.var.getUser().Id;
  const { projectId, workspaceId } = c.req.query();

  if (!ObjectId.isValid(projectId)) {
    return c.json({ message: 'invalid project id' }, 400);
  } else if (!ObjectId.isValid(workspaceId)) {
    return c.json({ message: 'invalid workspace id' }, 400);
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return c.json({ message: 'no document for given project ID' }, 400);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return c.json({ message: 'no document for given workspace ID' }, 400);
  }
  if (!workspace.members.includes(userId)) {
    return c.json({
      message: "you don't not belong to the workspace this project exist on",
    });
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: userId, workspaceId: workspaceId },
  });
  if (!workspaceMember) {
    return c.json('Invalid workspaceId');
  }
  const member = await prisma.projectMember.findFirst({
    where: { memberId: workspaceMember.id, projectId: projectId },
  });
  if (member) {
    return c.json({ message: 'Already a member of this project' });
  }

  const { email, image, firstname, lastname } = await prisma.user.findUnique({
    where: { id: userId },
  });
  const projectMemberShip = await prisma.projectMember.create({
    data: {
      email,
      name: `${firstname} ${lastname}`,
      projectId,
      workspaceId,
      image,
      memberId: workspaceMember.id,
      userId,
    },
  });

  const updated_project = await prisma.project.update({
    where: { id: project.id },
    data: { members: [...project.members, workspaceMember.id] },
  });
  return c.json({
    message: `You are now a member of ${project.name} `,
    data: updated_project,
    projectMemberShip,
  });
};
//test this code below !
const leaveProject = async (c: Context) => {
  const userId = c.var.getUser().id;
  const body = await c.req.json();
  const { data, error } = projectMemberValidator(body);
  if (error) {
    return c.json(`Validation Error:  ${error.errors[0].message}`);
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: userId },
  });

  const member = await prisma.projectMember.findFirst({
    where: { memberId: workspaceMember.id, projectId: data.projectId },
  });
  await prisma.projectMember.delete({
    where: {
      id: member.id,
      projectId: data.projectId,
      memberId: workspaceMember.id,
      userId,
    },
  });

  return c.json({
    message: `${data.username} has been removed from this project`,
  });
};
//test this code below !
const removeProjectMember = async (c: Context) => {
  const userId = c.var.getUser().id;
  const body = await c.req.json();
  const { data, error } = projectMemberValidator(body);
  if (error) {
    return c.json(`Validation Error:  ${error.errors[0].message}`);
  }
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (project.creator !== userId) {
    return c.json(
      {
        message: "sorry, you can't remove a member unless you're an admin",
      },
      401
    );
  }

  const member = await prisma.projectMember.findFirst({
    where: { memberId: data.memberId, projectId: data.projectId },
  });
  await prisma.projectMember.delete({
    where: {
      id: member.id,
      projectId: data.projectId,
      memberId: data.memberId,
    },
  });

  return c.json({
    message: `${data.username} has been removed from this project`,
  });
};

//test this code below !
const updateProject = async (c: Context) => {
  const projectId = c.req.param('projectId');
  const body: Partial<TProject> = await c.req.json();
  const data = projectUpdateValidator(body);
  if (data.error) {
    c.status(400);
    return c.json({
      message: `Validation Error: ${data.error.errors[0].message} `,
    });
  }
  const project = await prisma.project.update({
    where: { id: projectId },
    data: data.data,
  });

  return c.json({ message: 'project updated successfully', data: project });
};

//test this code below !
const manageProjectRole = async (c: Context) => {
  const body = await c.req.json();
  const { error, data } = projectRoleValidator(body);
  if (error) {
    return c.json({ message: `${error.errors[0].message}` }, 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (data.workspaceMembers && data.workspaceMembers.length > 0) {
    const members_id: Array<{ userId: string; notificationId: string }> = [];
    for (const member of data.workspaceMembers) {
      const notification = await prisma.notification.create({
        data: {
          link: `http://localhost/project/invite?projectId=${data.projectId}&workspaceId=${data.workspaceId}`,
          text: `You are invited to ${project.name} project`,
          userId: member.userId,
        },
      });

      members_id.push({
        userId: member.userId,
        notificationId: notification.id,
      });
    }

    customEmitter.emit(
      'invite_workspace_members_to_project',
      JSON.stringify(members_id)
    );
  } else if (data.projectMembers && data.projectMembers.length > 0) {
    for (const member of data.projectMembers) {
      await prisma.projectMember.update({
        where: {
          id: member.projectMembershipId,
        },
        data: {
          role: member.role,
        },
      });
    }
  }

  return c.json({ message: 'Invite sent successfully' });
};

const getAllProjectChannel = async (c: Context) => {
  const projectId = c.req.param('projectId');
  const channels = await prisma.channel.findMany({ where: { projectId } });
  return c.json({ message: 'channels retrieved successfully', data: channels });
};

const createChannel = async (c: Context) => {
  const creator = c.var.getUser().id;
  const body = await c.req.json();

  const { data, error } = channelValidator(body);

  if (error) {
    c.status(400);
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }
  if (
    !ObjectId.isValid(data.projectId) ||
    !ObjectId.isValid(data.workspaceId)
  ) {
    c.status(404);
    return c.json({ message: 'Invalid Id(s)' });
  }
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });
  if (!project) {
    c.status(404);
    return c.json({ message: 'invalid or bad project id' });
  }
  const workspace = await prisma.workspace.findUnique({
    where: { id: data.workspaceId },
  });
  if (!workspace) {
    c.status(404);
    return c.json({ message: 'invalid or bad workspace id' });
  }
  const channel = await prisma.channel.create({
    data: {
      ...data,
      members: [creator],
    },
  });

  return c.json({ message: 'channel created successfully', data: channel });
};

const updateChannel = async (c: Context) => {
  const body = await c.req.json();
  const channelId = c.req.param('channelId');
  const { error, data } = channelUpdateValidator(body);
  if (error) {
    c.status(400);
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }

  if (!ObjectId.isValid(channelId)) {
    c.status(404);
    return c.json({ message: 'invalid channelId' });
  }

  const exist_channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });
  if (!exist_channel) {
    c.status(404);
    return c.json({ message: 'channel not found' });
  }

  const channel = await prisma.channel.update({
    where: { id: channelId },
    data: data,
  });
  return c.json({ message: 'channel updated successfully', data: channel });
};
//CHECK JoinChannel Middleware
const joinChannel = async (c: Context) => {
  const param = c.req.param();

  if (
    !ObjectId.isValid(param['channelId']) ||
    !ObjectId.isValid(param['userId'])
  ) {
    c.status(404);
    return c.json({ message: 'invalid ids' });
  }
  const data = await prisma.channel.findUnique({
    where: { id: param['channelId'] },
  });

  if (!data) {
    c.status(404);
    return c.json({ message: 'channel not found' });
  }

  const user = await prisma.user.findUnique({ where: { id: param['userId'] } });
  if (!user) {
    c.status(404);
    return c.json({ message: 'channel not found' });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: data.workspaceId },
  });
  const channel = await prisma.channel.update({
    where: { id: param['channelId'], visibility: false },
    data: { members: [...data.members, membership.id] },
  });

  c.json({ message: 'joined channel successfully', data: channel });
};

const leaveChannel = async (c: Context) => {
  const param = c.req.param();

  const data = await prisma.channel.findUnique({
    where: { id: param['channelId'] },
  });

  const filteredMember = data.members.filter(
    (item) => item !== param['userId']
  );
  const channel = await prisma.channel.update({
    where: { id: param['channelId'] },
    data: { members: filteredMember },
  });

  return c.json({ message: 'leaved channel successfully', data: channel });
};

const joinChannelRequest = async (c: Context) => {
  const userId = c.var.getUser().id;
  const body = await c.req.json();
  const { data, error } = channelReqValidator(body);
  if (error) {
    c.status(400);
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }

  const req = await prisma.joinChannelRequest.findUnique({
    where: { userId, channelId: data.channelId },
  });
  if (req) {
    return c.json({ message: 'request sent', data: req });
  }
  const channelReq = await prisma.joinChannelRequest.create({
    data: {
      name: data.name,
      toAdmin: data.toAdmin,
      userId: userId,
      channelId: data.channelId,
    },
  });

  return c.json({
    message: 'join request successfully sent',
    data: channelReq,
  });
};

const acceptOrRevokeChannelReq = async (c: Context) => {
  const body = await c.req.json();
  const { data, error } = acceptOrRejectReqValidator(body);
  if (error) {
    c.status(400);
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }

  if (data.signal === 'revoke') {
    await prisma.joinChannelRequest.delete({
      where: { channelId: data.channelId },
    });
    return c.json({
      message: 'request to join channel has been revoked successfully',
      data: {},
    });
  } else if (data.signal === 'accept') {
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
    });
    await prisma.channel.update({
      where: { id: data.channelId },
      data: { members: [...channel.members, data.userId] },
    });
    console.log(data.channelId);
    await prisma.joinChannelRequest.delete({
      where: { channelId: data.channelId },
    });

    return c.json(
      {
        message: 'request to join channel has been accepted successfully ',
      },
      200
    );
  }

  return c.json({ message: 'invalid signal' }, 400);
};

const chatWithArtificium = async (c: Context) => {
  const payload = await c.req.json();
  const { error, data } = artificiumMessagePayloadValidator(payload);

  if (error) {
    return c.json({ message: error.errors[0].message }, 400);
  }
  const message_length = await redis.client.LLEN('art_message');
  if (message_length >= MAX_CACHE_SIZE) {
    const messages = await redis.client.LRANGE('art_message', 0, 50);
    const parsed_messages = messages
      .map((message) => ({
        ...JSON.parse(message),
        timestamp: new Date(JSON.parse(message).timestamp),
      }))
      .reverse();
    await prisma.artificiumChat.createMany({
      data: [...parsed_messages],
    });

    await redis.client.LTRIM('art_message', 50, -1);
  }
  await redis.client.LPUSH(
    'art_message',
    JSON.stringify({
      id: new ObjectId().toHexString(),
      timestamp: Date.now(),
      ...data,
    })
  );

  //send a request to the AI

  return c.json({ message: 'message sent successfully' });
};

const chatInGroups = async (c: Context) => {
  const payload = await c.req.json();
  const { error, data } = artificiumMessagePayloadValidator(payload);
  if (error) {
    return c.json({ message: error.errors[0].message }, 400);
  }
  const message_length = await redis.client.LLEN('chat_messages');
  if (message_length >= MAX_CACHE_SIZE) {
    const messages = await redis.client.LRANGE('chat_messages', 0, 50);
    const parsed_messages = messages
      .map((message) => ({
        ...JSON.parse(message),
        timestamp: new Date(JSON.parse(message).timestamp),
      }))
      .reverse();
    await prisma.message.createMany({
      data: [...parsed_messages],
    });

    await redis.client.LTRIM('chat_messages', 50, -1);
  }
  await redis.client.LPUSH(
    'chat_messages',
    JSON.stringify({
      id: new ObjectId().toHexString(),
      timestamp: Date.now(),
      ...data,
    })
  );

  return c.json({ message: 'message sent successfully' });
};

const getUserChatWithArtificium = async (c: Context) => {
  const param = c.req.query();
  if (!param['projectId'] && !param['userId']) {
    return c.json(
      {
        message: "parameter 'projectId' and 'userId' are required",
      },
      400
    );
  }

  if (process.env.NODE_ENV === 'test') {
    const projectId = '85830204820';
    await redis.client.LPUSH(
      'art_message',
      JSON.stringify({
        projectId,
        text: 'Hello from cache',
        timestamp: Date.now(),
        user: 'HUMAN',
      })
    );
  }
  const redisCacheMessages =
    (await redis.client.LRANGE('art_message', 0, 50)) || [];
  const cacheMessages = redisCacheMessages
    .map((message) => JSON.parse(message))
    .filter(
      (message) =>
        message.projectId === param['projectId'] &&
        message.userId === param['userId']
    )
    .reverse();
  const dbMessages = await prisma.artificiumChat.findMany({
    where: { projectId: param['projectId'], userId: param['userId'] },
  });

  const groupMessages = [...dbMessages, ...cacheMessages];

  return c.json({
    message: 'message retrieved successfully',
    data: groupMessages,
  });
};

const getUsersChat = async (c: Context) => {
  const param = c.req.query();
  if (!param['projectId']) {
    return c.json(
      {
        message: "parameter 'projectId' are required",
      },
      400
    );
  }

  if (process.env.NODE_ENV === 'test') {
    const projectId = '85830204820';
    await redis.client.LPUSH(
      'chat_messages',
      JSON.stringify({
        projectId,
        text: 'Hello from cache',
        timestamp: Date.now(),
        user: 'HUMAN',
      })
    );
  }
  const redisCacheMessages =
    (await redis.client.LRANGE('chat_messages', 0, 50)) || [];
  const cacheMessages = redisCacheMessages
    .map((message) => JSON.parse(message))
    .filter((message) => message.projectId === param['projectId'])
    .reverse();
  const dbMessages = await prisma.message.findMany({
    where: { projectId: param['projectId'] },
  });

  const groupMessages = [...dbMessages, ...cacheMessages];

  return c.json({
    message: 'message retrieved successfully',
    data: groupMessages,
  });
};

const updateUserChatWithArtificium = async (c: Context) => {
  const payload = await c.req.json();
  const { error, data } = updateArtificiumMessagePayloadSchema(payload);
  if (error) {
    return c.json(
      { message: `Validation Error: ${error.errors[0].message}` },
      400
    );
  }

  const messages = await redis.client.LRANGE('new_message', 0, 50);
  let indexToUpdateAt: number;
  if (messages && messages.length > 0) {
    const list_of_msg_to_update: Array<string> = messages.filter((msg, idx) => {
      if (JSON.parse(msg).id === data.messageId) {
        indexToUpdateAt = idx;
        return true;
      }
    });
    if (list_of_msg_to_update.length < 1) {
      const updated_chat = await prisma.artificiumChat.update({
        where: { id: data.messageId },
        data: { text: data.text, timestamp: new Date(Date.now()) },
      });

      return c.json({
        message: 'message updated successfully',
        data: updated_chat,
      });
    }
    const msg_to_update = JSON.parse(list_of_msg_to_update[0]);
    const mTime = new Date(Date.now());

    await redis.client.LSET(
      'new_message',
      indexToUpdateAt,
      JSON.stringify({ timestamp: mTime, ...msg_to_update, text: data.text })
    );

    // const latest_msg = redis.client.LRANGE('new_message', 0, indexToUpdateAt);

    return c.json({
      message: 'message updated succcessfully',
      data: { ...msg_to_update, text: data.text, timestamp: mTime },
    });
  }
};

const updateUserChatInGroups = async (c: Context) => {
  const payload = await c.req.json();
  const { error, data } = updateArtificiumMessagePayloadSchema(payload);
  if (error) {
    return c.json(
      { message: `Validation Error: ${error.errors[0].message}` },
      400
    );
  }

  const messages = await redis.client.LRANGE('chat_messages', 0, 50);
  let indexToUpdateAt: number;
  if (messages && messages.length > 0) {
    const list_of_msg_to_update: Array<string> = messages.filter((msg, idx) => {
      if (JSON.parse(msg).id === data.messageId) {
        indexToUpdateAt = idx;
        return true;
      }
    });
    if (list_of_msg_to_update.length < 1) {
      const updated_chat = await prisma.message.update({
        where: { id: data.messageId },
        data: { text: data.text, timestamp: new Date(Date.now()) },
      });

      return c.json({
        message: 'message updated successfully',
        data: updated_chat,
      });
    }
    const msg_to_update = JSON.parse(list_of_msg_to_update[0]);
    const mTime = new Date(Date.now());

    await redis.client.LSET(
      'chat_messages',
      indexToUpdateAt,
      JSON.stringify({ timestamp: mTime, ...msg_to_update, text: data.text })
    );

    return c.json({
      message: 'message updated succcessfully',
      data: { ...msg_to_update, text: data.text, timestamp: mTime },
    });
  }
};

const deleteChatWithArtificium = async (c: Context) => {
  const payload = await c.req.json();
  const { data, error } = deleteArtificiumMessageValidator(payload);
  if (error) {
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }
  let indexToUpdateAt: number;

  const cacheMsgs = await redis.client.LRANGE('new_message', 0, 50);
  const msg = cacheMsgs.filter((msg, idx) => {
    if (JSON.parse(msg).id === data.messageId) {
      indexToUpdateAt = idx;
      return true;
    }
  })[0];

  const mTime = new Date(Date.now());
  if (!msg) {
    const updated_data = data['deleteForAll']
      ? await prisma.artificiumChat.update({
          where: { id: data.messageId },
          data: { deletedForAll: true, timestamp: mTime },
        })
      : await prisma.artificiumChat.update({
          where: { id: data.messageId },
          data: { deletedForMe: true, timestamp: mTime },
        });
    return c.json({
      message: `message with the id ${updated_data.id} successfully deleted.`,
    });
  }

  const parsed_messages = JSON.parse(msg);

  const deleted = data['deleteForAll']
    ? await redis.client.LSET(
        'new_message',
        indexToUpdateAt,
        JSON.stringify({
          ...parsed_messages,
          timestamp: mTime,
          deletedForAll: true,
        })
      )
    : await redis.client.LSET(
        'new_message',
        indexToUpdateAt,
        JSON.stringify({
          ...parsed_messages,
          timestamp: mTime,
          deletedForMe: true,
        })
      );

  return c.json({
    message: `message with the id ${
      parsed_messages.id || JSON.parse(deleted).id
    } successfully deleted`,
  });
};

const deleteUserChatInGroup = async (c: Context) => {
  const payload = await c.req.json();
  const { data, error } = deleteArtificiumMessageValidator(payload);
  if (error) {
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }
  let indexToUpdateAt: number;

  const cacheMsgs = await redis.client.LRANGE('chat_messages', 0, 50);
  const msg = cacheMsgs.filter((msg, idx) => {
    if (JSON.parse(msg).id === data.messageId) {
      indexToUpdateAt = idx;
      return true;
    }
  })[0];

  const mTime = new Date(Date.now());
  if (!msg) {
    const updated_data = data['deleteForAll']
      ? await prisma.message.update({
          where: { id: data.messageId },
          data: { deletedForAll: true, timestamp: mTime },
        })
      : await prisma.message.update({
          where: { id: data.messageId },
          data: { deletedForMe: true, timestamp: mTime },
        });
    return c.json({
      message: `message with the id ${updated_data.id} successfully deleted.`,
    });
  }

  const parsed_messages = JSON.parse(msg);

  const deleted = data['deleteForAll']
    ? await redis.client.LSET(
        'chat_messages',
        indexToUpdateAt,
        JSON.stringify({
          ...parsed_messages,
          timestamp: mTime,
          deletedForAll: true,
        })
      )
    : await redis.client.LSET(
        'chat_messages',
        indexToUpdateAt,
        JSON.stringify({
          ...parsed_messages,
          timestamp: mTime,
          deletedForMe: true,
        })
      );

  return c.json({
    message: `message with the id ${
      parsed_messages.id || JSON.parse(deleted).id
    } successfully deleted`,
  });
};

const createThread = async (c: Context) => {
  const threaded = await prisma.thread.create({
    data: {},
  });

  return c.json(
    {
      data: {
        threadID: threaded.id,
        timestamp: threaded.timeStamp,
        message: 'Thread created successfully',
      },
    },
    200
  );
};

const uploadWorkspaceImage = async (c: Context) => {
  const req = await c.req.json();
  const { error, data } = validateImageUpdateSchema(req);
  if (error) {
    return c.json(
      { message: `Validation Error: ${error.errors[0].message}` },
      400
    );
  }
  const user = c.var.getUser().id;
  const body = await c.req.parseBody({ dot: true });
  const file = body['image'] as File;

  if (!file) {
    return c.json('no file uploaded');
  }

  const imageBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  cloudinary.config({
    cloud_name: 'dtah4aund',
    api_key: '232487372395222',
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
  });
  const uploadResult = (await cloudinary.uploader
    .upload(dataUri, {
      public_id: 'profile',
    })
    .catch((error) => {
      console.log(error);
    })) as UploadApiResponse;
  const existing_user = await prisma.user.findUnique({
    where: { id: user.id },
  });

  await prisma.workspace.update({
    where: { owner: existing_user.id, id: data.workspaceId },
    data: { image: uploadResult.secure_url },
  });

  return c.json({ message: 'message uploaded successfully' });
};

const createGmailIntegration = async (c: Context) => {
  const userId = c.var.getUser().id;
  const body = await c.req.json();

  const { error, data } = integration.validateGmailIntegrationPayload(body);
  if (error) {
    return c.json(
      { message: `Validation Error: ${error.errors[0].message}` },
      400
    );
  }

  const found = await prisma.integration.findFirst({
    where: { service: 'gmail', userId: userId },
  });

  if (found) {
    return c.json({ message: 'Integration success' });
  }
  const REDIRECT_URI =
    process.env.NODE_ENV === 'development' ? 'http://localhost:5174' : '';

  const google_auth_client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    REDIRECT_URI
  );

  const {
    tokens: { access_token, refresh_token },
  } = await google_auth_client.getToken(data.code);

  console.log(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

  await prisma.integration.create({
    data: {
      service: 'gmail',
      userId: userId,
      credentials: {
        access_token,
        refresh_token,
      },
    },
  });

  return c.json({ message: 'Integration success' });
};

export {
  getAllUserWorkspace,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  getWorkspaceMembers,
  joinWorkspace,
  getAllWorskpaceProjects,
  createNewWorkspaceProject,
  updateProject,
  createChannel,
  getAllProjectChannel,
  updateChannel,
  joinChannel,
  leaveChannel,
  joinChannelRequest,
  acceptOrRevokeChannelReq,
  leaveworkspace,
  uploadWorkspaceImage,
  chatWithArtificium,
  chatInGroups,
  getUserChatWithArtificium,
  getUsersChat,
  updateUserChatWithArtificium,
  updateUserChatInGroups,
  deleteChatWithArtificium,
  deleteUserChatInGroup,
  createThread,
  createGmailIntegration,
  removeProjectMember,
  leaveProject,
  manageProjectRole,
  customEmitter,
};
