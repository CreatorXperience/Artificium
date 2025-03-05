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
  const personalWorkspaces = await prisma.workspace.findMany({
    where: { owner: userId },
  });

  const otherWorkspaces = await prisma.workspace.findMany({
    take: 20,
    where: { visibility: false },
  });

  return c.json({
    messages: 'success',
    data: { personalWorkspaces, otherWorkspaces },
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

  const workspaceObj = {
    ...body,
    owner,
    id: workspaceID,
    url: `http://localhost:3030/workspace/${workspaceID}`,
    totalMembers: 1,
    workspaceAdmin: [owner],
  };

  const workspace = await prisma.workspace.create({ data: workspaceObj });
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
    data: body,
  });
  return c.json({
    message: `workspace ${id} updated successfully`,
    data: updatedWorkspace,
  });
};

export { getAllUserWorkspace, createWorkspace, getWorkspace, updateWorkspace };
