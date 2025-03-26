import { PrismaClient } from '@prisma/client';
import workspace from './workspaces';
import { auth } from '@org/auth';

const prisma = new PrismaClient();
describe('/workspace', () => {
  let user;
  let userData;
  beforeAll(async () => {
    await auth.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'allyearmustobey@gmail.com',
        password: '123456',
        firstname: 'tester',
        lastname: 'peter',
      }),
    });
    user = await auth.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'allyearmustobey@gmail.com',
        password: '123456',
      }),
      headers: new Headers({ Content_Type: 'application/json' }),
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /workspace', () => {
    test('should return status of 200 if or not workspace(s) is found', async () => {
      const res = await workspace.request('/workspace', {
        method: 'GET',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(200);
      let data = await res.json();
      expect(data.data.personalWorkspaces.length).toBe(0);
      expect(data.data.publicWorkspace.length).toBe(0);
      userData = await user.json();

      await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });

      const workspaceRes = await workspace.request('/workspace', {
        method: 'GET',
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(workspaceRes.status).toBe(200);
      data = await workspaceRes.json();
      expect(data.data.personalWorkspaces.length).toBe(1);

      expect(data.data.publicWorkspace.length).toBe(0);
    });
  });

  describe('POST /workspace', () => {
    test('should return status code of 400 if payload is invalid or empty', async () => {
      const res = await workspace.request('/workspace', {
        method: 'POST',
        body: JSON.stringify({
          badprop: 'bad-payload',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return 401 if a workspace with the same name already exist', async () => {
      await prisma.workspace.create({
        data: {
          name: 'example-workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });
      const res = await workspace.request('/workspace', {
        method: 'POST',
        body: JSON.stringify({
          name: 'example-workspace',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(401);
    });

    test('should return 200 if payload is good and unique', async () => {
      const res = await workspace.request('/workspace', {
        method: 'POST',
        body: JSON.stringify({
          name: 'unique-workspace',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /workspace/:id', () => {
    let newWorkspace;
    beforeAll(async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });
    });
    test('should return 200 status', async () => {
      const res = await workspace.request(`/workspace/${newWorkspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'change workspace',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      const existing_workspace = await prisma.workspace.findUnique({
        where: { id: newWorkspace.id },
      });
      expect(res.status).toBe(200);
      expect(existing_workspace.name).toBe('change workspace');
    });

    test('should return 400 status is payload is bad or empty', async () => {
      const res = await workspace.request(`/workspace/${newWorkspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify(null),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /workspace/join', () => {
    let newWorkspace;
    beforeAll(async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });
    });
    afterEach(async () => {
      await prisma.workspaceMember.deleteMany();
    });
    test('should return 400 if query param is empty or not set', async () => {
      const res = await workspace.request(`/workspace/join?workspaceId=`, {
        method: 'POST',
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return 400 if query param workspaceId is not a valid ObjectId', async () => {
      const res = await workspace.request(
        `/workspace/join?workspaceId=${1234}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(400);
    });

    test('should reutrn 201 response if user is already a member of the provided workspaceId', async () => {
      await prisma.workspaceMember.create({
        data: {
          email: userData.data.email,
          image: userData.data.image,
          name: `${userData.data.firstname} ${userData.data.lastname}`,
          userId: userData.data.id,
          workspaceId: newWorkspace.id,
        },
      });

      const res = await workspace.request(
        `/workspace/join?workspaceId=${newWorkspace.id}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(201);
    });

    test('should return status code of 200 if payload is valid and user is not a member of the provided workspace id', async () => {
      const res = await workspace.request(
        `/workspace/join?workspaceId=${newWorkspace.id}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      const spaceMember = await prisma.workspaceMember.findUnique({
        where: { userId: userData.id, workspaceId: newWorkspace.id },
      });
      expect(spaceMember.userId).toBe(userData.data.id);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /workspace/leave', () => {
    let newWorkspace;
    beforeAll(async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });
    });
    afterEach(async () => {
      await prisma.workspaceMember.deleteMany();
    });
    test('should return 400 if workspace id is empty or bad', async () => {
      const res = await workspace.request('/workspace/leave?workspaceId=', {
        method: 'POST',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 400 if  workspaceId is not a valid objectId', async () => {
      const res = await workspace.request(
        `/workspace/leave?workspaceId=${'123'}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(400);
    });

    test('should return 404 if workspaceId is valid but no workspace attached to it', async () => {
      await prisma.workspace.delete({ where: { id: newWorkspace.id } });
      const res = await workspace.request(
        `/workspace/leave?workspaceId=${newWorkspace.id}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(404);
    });

    test('should return status code 200  if workspaceID is valid ObjectId and attached to a workspace', async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          email: userData.data.email,
          image: userData.data.image,
          name: `${userData.data.firstname} ${userData.data.lastname}`,
          userId: `${userData.data.id}`,
          workspaceId: newWorkspace.id,
        },
      });
      const res = await workspace.request(
        `/workspace/leave?workspaceId=${newWorkspace.id}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      const space = await prisma.workspace.findUnique({
        where: { id: newWorkspace.id },
      });

      expect(space.members).not.toContain(userData.data.id);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /workspace/project/:workspaceId', () => {
    let newWorkspace;
    beforeAll(async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.workspaceMember.deleteMany();
    });
    test('should return 400 if workspaceId is Invalid or empty', async () => {
      const res = await workspace.request(`/workspace/project/${123445}`, {
        method: 'GET',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 400 if workspaceId is Invalid or empty', async () => {
      const res = await workspace.request(
        `/workspace/project/${newWorkspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(200);
    });
  });

  describe('POST /workspace/project', () => {
    let newWorkspace;
    beforeAll(async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.workspaceMember.deleteMany();
    });
    test('should return 400 if data is bad or incomplete', async () => {
      const res = await workspace.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 404 if no workspace is attached to the workspaceId', async () => {
      //  const  await
    });
  });
});
