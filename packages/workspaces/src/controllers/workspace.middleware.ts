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
} from '@org/database';
import { PrismaClient } from '@prisma/client';
import { Context } from 'hono';
import { ObjectId } from 'mongodb';

const prisma = new PrismaClient();

const getAllUserWorkspace = async (c: Context) => {
  const userId = c.var.getUser().userId;
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
  const owner = c.var.getUser().userId;
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

  const workspaceObj = {
    ...data.data,
    owner,
    id: workspaceID,
    url: `http://localhost:3030/workspace/${workspaceID}`,
    totalMembers: 1,
    workspaceAdmin: [owner],
    members: [owner],
    readAccess: [owner],
    writeAccess: [owner],
  };

  const user = await prisma.user.findUnique({ where: { id: owner } });

  const workspace = await prisma.workspace.create({
    data: {
      ...workspaceObj,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      email: user.email,
      image: user.image,
      name: `${user.firstname} ${user.lastname}`,
      userId: owner,
      workspaceId: workspace.id,
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
  const userID = c.var.getUser().userId;
  if (!workspaceId) {
    c.status(400);
    return c.json({ message: 'incomplete query param' });
  }

  const member = await prisma.workspaceMember.findUnique({
    where: { userId: userID, workspaceId: workspaceId },
  });
  if (member) {
    return c.json({ message: 'user is already a member of this workspace' });
  }

  const user = await prisma.user.findUnique({ where: { id: userID } });
  const newMember = await prisma.workspaceMember.create({
    data: {
      email: user.email,
      image: user.image,
      name: `${user.firstname} ${user.lastname}`,
      userId: userID,
      workspaceId: workspaceId,
    },
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { members: [...workspace.members, user.id] },
  });

  return c.json({
    message: 'your are now a member of this workspace',
    data: newMember,
  });
};

const getAllWorskpaceProjects = async (c: Context) => {
  const workspaceId = c.req.param('workspaceId');
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
  const creator = c.var.getUser().userId;
  const body: TProject = await c.req.json();
  const data = projectValidator(body);
  if (data.error) {
    c.status(400);
    return c.json({
      message: `Validation error: ${data.error.errors[0].message}`,
    });
  }
  const project = await prisma.project.create({
    data: {
      name: data.data.name,
      purpose: data.data.purpose,
      workspaceId: data.data.workspaceId,
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
  const creator = c.var.getUser().userId;
  const body = await c.req.json();

  const { data, error } = channelValidator(body);

  if (error) {
    c.status(400);
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
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

  const channel = await prisma.channel.update({
    where: { id: channelId },
    data: data,
  });
  return c.json({ message: 'channel updated successfully', data: channel });
};

const joinChannel = async (c: Context) => {
  const param = c.req.param();

  const data = await prisma.channel.findUnique({
    where: { id: param['channelId'] },
  });
  const channel = await prisma.channel.update({
    where: { id: param['channelId'] },
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
  const userId = c.var.getUser().userId;
  const body = await c.req.json();
  const { data, error } = channelReqValidator(body);
  if (error) {
    c.status(400);
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }

  const req = await prisma.joinChannelRequest.findUnique({
    where: { userId },
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
    await prisma.joinChannelRequest.delete({
      where: { channelId: data.channelId },
    });
  }
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
};
