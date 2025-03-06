import {
  TCreateWorkspace,
  TWorkspace,
  workspaceValidator,
  updateWorkspaceValidator,
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
  const data = workspaceValidator(body);
  const workspaceID = new ObjectId().toHexString();
  if (data.error) {
    c.status(400);
    return c.json({
      message: `Validation Error: ${data.error.errors[0].message}`,
      status: 400,
    });
  }

  const existing_workspace = await prisma.workspace.findUnique({
    where: { name: body.name },
  });
  if (existing_workspace) {
    c.status(401);
    return c.json({ message: 'workspace with the same name already exist' });
  }

  const workspaceObj = {
    ...body,
    owner,
    id: workspaceID,
    url: `http://localhost:3030/workspace/${workspaceID}`,
    totalMembers: 1,
    workspaceAdmin: [owner],
    members: [owner],
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
  const body = (await c.req.json()) as Partial<TWorkspace>;

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
      ...body,
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

export {
  getAllUserWorkspace,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  getWorkspaceMembers,
  joinWorkspace,
};
