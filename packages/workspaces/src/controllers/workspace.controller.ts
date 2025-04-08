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
} from '@org/database';
import { PrismaClient } from '@prisma/client';
import { Context } from 'hono';
import { ObjectId } from 'mongodb';
import logger from '../../utils/logger';

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
  const member = await prisma.workspaceMember.findUnique({
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

  await prisma.workspaceMember.delete({
    where: { userId: userID, workspaceId: workspace.id },
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

const createNewWorkspaceProject = async (c: Context) => {
  const creator = c.var.getUser().id;
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
  const project = await prisma.project.create({
    data: {
      ...data.data,
      createdAt: new Date(),
      members: [creator],
    },
  });

  return c.json({ message: 'project successfully created', data: project });
};

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

  const channel = await prisma.channel.update({
    where: { id: param['channelId'], visibility: false },
    data: { members: [...data.members, param['userId']] },
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
  }
};

const chatWithArtificium = async (c: Context) => {
  const payload = await c.req.json();
  const { error, data } = artificiumMessagePayloadValidator(payload);
  if (error) {
    return c.json({ message: error.errors[0].message }, 400);
  }
  const message_length = await redis.client.LLEN('new_message');
  if (message_length >= MAX_CACHE_SIZE) {
    const messages = await redis.client.LRANGE('new_message', 0, 50);
    const parsed_messages = messages
      .map((message) => ({
        ...JSON.parse(message),
        timestamp: new Date(JSON.parse(message).timestamp),
      }))
      .reverse();
    await prisma.artificiumChat.createMany({
      data: [...parsed_messages],
    });

    await redis.client.LTRIM('new_message', 50, -1);
  }
  await redis.client.LPUSH(
    'new_message',
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
  if (!param['projectId']) {
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
      'new_message',
      JSON.stringify({
        projectId,
        text: 'Hello from cache',
        timestamp: Date.now(),
        user: 'HUMAN',
      })
    );
  }
  const redisCacheMessages =
    (await redis.client.LRANGE('new_message', 0, 50)) || [];
  const cacheMessages = redisCacheMessages
    .map((message) => JSON.parse(message))
    .filter((message) => message.projectId === param['projectId'])
    .reverse();
  const dbMessages = await prisma.artificiumChat.findMany({
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
  chatWithArtificium,
  getUserChatWithArtificium,
  updateUserChatWithArtificium,
  deleteChatWithArtificium,
};
