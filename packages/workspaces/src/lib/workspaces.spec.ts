import { PrismaClient } from '@prisma/client';
import app from './workspaces';
import { auth } from '@org/auth';
import redis from 'redis';
import { ObjectId } from 'mongodb';

const redisClient = redis.createClient();

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
      const res = await app.request('/workspace', {
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

      const workspaceRes = await app.request('/workspace', {
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
      const res = await app.request('/workspace', {
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
      const res = await app.request('/workspace', {
        method: 'POST',
        body: JSON.stringify({
          name: 'example-workspace',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(401);
    });

    test('should return 200 if payload is good and unique', async () => {
      const res = await app.request('/workspace', {
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
      const res = await app.request(`/workspace/${newWorkspace.id}`, {
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
      const res = await app.request(`/workspace/${newWorkspace.id}`, {
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
      const res = await app.request(`/workspace/join?workspaceId=`, {
        method: 'POST',
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return 400 if query param workspaceId is not a valid ObjectId', async () => {
      const res = await app.request(`/workspace/join?workspaceId=${1234}`, {
        method: 'POST',
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return 201 response if user is already a member of the provided workspaceId', async () => {
      await prisma.workspaceMember.create({
        data: {
          email: userData.data.email,
          image: userData.data.image,
          name: `${userData.data.firstname} ${userData.data.lastname}`,
          userId: userData.data.id,
          workspaceId: newWorkspace.id,
        },
      });

      const res = await app.request(
        `/workspace/join?workspaceId=${newWorkspace.id}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(201);
    });

    test('should return status code of 200 if payload is valid and user is not a member of the provided workspace id', async () => {
      const res = await app.request(
        `/workspace/join?workspaceId=${newWorkspace.id}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      const spaceMember = await prisma.workspaceMember.findFirst({
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
      const res = await app.request('/workspace/leave?workspaceId=', {
        method: 'POST',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 400 if  workspaceId is not a valid objectId', async () => {
      const res = await app.request(`/workspace/leave?workspaceId=${'123'}`, {
        method: 'POST',
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return 404 if workspaceId is valid but no workspace attached to it', async () => {
      await prisma.workspace.delete({ where: { id: newWorkspace.id } });
      const res = await app.request(
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
      const res = await app.request(
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
      const res = await app.request(`/workspace/project/${123445}`, {
        method: 'GET',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 200 if workspaceId  valid', async () => {
      const res = await app.request(`/workspace/project/${newWorkspace.id}`, {
        method: 'GET',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /workspace/membership/:workspaceId', () => {
    let workspace;
    beforeAll(async () => {
      workspace = await prisma.workspace.create({
        data: {
          name: `${userData.data.firstname} ${userData.data.lastname}`,
          owner: userData.data.id,
          totalMembers: 1,
        },
      });
    });
    afterEach(async () => {
      await prisma.workspaceMember.deleteMany();
    });
    test('should return 200 if workspace exist and membership is found', async () => {
      await prisma.workspaceMember.create({
        data: {
          email: userData.data.email,
          image: userData.data.image,
          name: `${userData.data.firstname} ${userData.data.lastname}`,
          userId: userData.data.id,
          workspaceId: workspace.id,
        },
      });
      const membership = await app.request(
        `/workspace/membership/${workspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(membership.status).toBe(200);
    });

    test('should return 404 if workspace does not  exist and membership is not found', async () => {
      await prisma.workspace.deleteMany();
      const membership = await app.request(
        `/workspace/membership/${workspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(membership.status).toBe(404);
    });

    test('should return 404 if workspace does not  exist and membership is not found', async () => {
      const membership = await app.request(
        `/workspace/membership/${workspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(membership.status).toBe(404);
    });

    test('should return 404 if workspace exist but no workspace membership ', async () => {
      workspace = await prisma.workspace.create({
        data: {
          name: `${userData.data.firstname} ${userData.data.lastname}`,
          owner: userData.data.id,
          totalMembers: 1,
        },
      });
      const membership = await app.request(
        `/workspace/membership/${workspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(membership.status).toBe(404);
    });
  });

  describe('POST /workspace/project', () => {
    let newWorkspace;
    let memberShipID;
    beforeEach(async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });

      memberShipID = await prisma.workspaceMember.create({
        data: {
          email: userData.data.email,
          image: userData.data.image,
          name: userData.data.firstname + ' ' + userData.data.lastname,
          userId: userData.data.id,
          workspaceId: newWorkspace.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.workspaceMember.deleteMany();
      await prisma.projectMember.deleteMany();
    });
    test('should return 400 if data is bad or incomplete', async () => {
      const res = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return status of 400 if workspaceId is invalid', async () => {
      const invalidId = '1233434454545';
      const res = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: invalidId,
          name: 'Project one',
          purpose: 'For testing purpose',
          members: [
            {
              name: 'peter',
              email: 'peterparker@gmail.com',
              image: 'http:///peter',
              memberId: memberShipID.id,
              workspaceId: newWorkspace.id,
              userId: userData.data.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return status 200 if members are included in the project payload', async () => {
      const res = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: newWorkspace.id,
          name: 'Project one',
          purpose: 'For testing purpose',
          members: [
            {
              name: 'peter',
              email: 'peterparker@gmail.com',
              image: 'http:///peter',
              memberId: memberShipID.id,
              workspaceId: newWorkspace.id,
              userId: userData.data.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(200);
    });

    test('should return 404 if no workspace is attached to the workspaceId', async () => {
      //  const  await
      const res = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: '1234567890',
          name: 'Project one',
          purpose: 'For testing purpose',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 404 if workspace is deleted ', async () => {
      await prisma.workspace.delete({ where: { id: newWorkspace.id } });
      const res = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: newWorkspace.id,
          name: 'Project one',
          purpose: 'For testing purpose',
          visibility: false,
          members: [
            {
              name: 'peter',
              email: 'peterparker@gmail.com',
              image: 'http:///peter',
              memberId: memberShipID.id,
              workspaceId: newWorkspace.id,
              userId: userData.data.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(404);
    });

    test('should return 200 when creating new project', async () => {
      const res = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: newWorkspace.id,
          name: 'Project one',
          purpose: 'For testing purpose',
          visibility: false,
          members: [
            {
              name: 'peter',
              email: 'peterparker@gmail.com',
              image: 'http:///peter',
              memberId: memberShipID.id,
              workspaceId: newWorkspace.id,
              userId: userData.data.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /workspace/project/membership', () => {
    let newWorkspace;
    let newProject;
    let workspaceMember;
    let projectMember;

    beforeEach(async () => {
      await prisma.$transaction(async (tx) => {
        newWorkspace = await tx.workspace.create({
          data: {
            name: 'test workspace',
            totalMembers: 1,
            members: [userData.data.id],
            owner: userData.data.id,
          },
        });

        newProject = await tx.project.create({
          data: {
            name: 'new project',
            purpose: '4 testing',
            createdAt: new Date(),
            workspaceId: newWorkspace.id,
            creator: userData.data.id,
            visibility: false,
          },
        });
        const { email, image, fullname, lastname, id } = userData.data;

        workspaceMember = await tx.workspaceMember.create({
          data: {
            email,
            image,
            name: `${fullname} ${lastname}`,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
        projectMember = await tx.projectMember.create({
          data: {
            email,
            image,
            memberId: workspaceMember.id,
            name: `${fullname} ${lastname}`,
            projectId: newProject.id,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
      });
    });

    afterAll(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.workspace.deleteMany();
        await tx.project.deleteMany();
        await tx.channel.deleteMany();
        await tx.projectMember.deleteMany();
      });

      await prisma.$disconnect();
    });
    test('should return 400 if any of the parameters id is invalid', async () => {
      const res = await app.request(
        `/workspace/project/membership?workspaceId=${
          newWorkspace.id
        }&projectId=${32546757686}&workspaceMembershipId=${workspaceMember.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(400);
    });

    test('should return 400 if all the paramater are valid ObjectId', async () => {
      const res = await app.request(
        `/workspace/project/membership?workspaceId=${newWorkspace.id}&projectId=${newProject.id}&workspaceMembershipId=${workspaceMember.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(200);
    });

    test('should return 404 if workspaceMembership is not found', async () => {
      await prisma.workspaceMember.delete({
        where: { id: workspaceMember.id },
      });
      const res = await app.request(
        `/workspace/project/membership?workspaceId=${newWorkspace.id}&projectId=${newProject.id}&workspaceMembershipId=${workspaceMember.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(404);
    });

    test("should return 404 if you're not a member of this project", async () => {
      await prisma.projectMember.delete({ where: { id: projectMember.id } });
      const res = await app.request(
        `/workspace/project/membership?workspaceId=${newWorkspace.id}&projectId=${newProject.id}&workspaceMembershipId=${workspaceMember.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(404);
    });

    // test('should return 404 if no ProjectMember found for the given id', async () => {
    //   const res = await app.request(
    //     `/workspace/project/membership?workspaceId=${
    //       newWorkspace.id
    //     }&projectId=${new ObjectId().toHexString()}`,
    //     {
    //       method: 'GET',
    //       headers: { Cookie: user.headers.get('set-cookie') },
    //     }
    //   );

    //   expect(res.status).toBe(404);
    // });

    // test('should return 404 if no ProjectMember found for the given id', async () => {
    //   const res = await app.request(
    //     `/workspace/project/membership?workspaceId=${
    //       newWorkspace.id
    //     }&projectId=${new ObjectId().toHexString()}`,
    //     {
    //       method: 'GET',
    //       headers: { Cookie: user.headers.get('set-cookie') },
    //     }
    //   );

    //   expect(res.status).toBe(404);
    // });
  });

  describe('GET /workspace/project/join', () => {
    let newWorkspace;
    let newProject;
    let workspaceMember;
    let projectMember;

    beforeEach(async () => {
      await prisma.$transaction(async (tx) => {
        newWorkspace = await tx.workspace.create({
          data: {
            name: 'test workspace',
            totalMembers: 1,
            members: [userData.data.id],
            owner: userData.data.id,
          },
        });

        newProject = await tx.project.create({
          data: {
            name: 'new project',
            purpose: '4 testing',
            createdAt: new Date(),
            workspaceId: newWorkspace.id,
            creator: userData.data.id,
            visibility: false,
          },
        });
        const { email, image, fullname, lastname, id } = userData.data;

        workspaceMember = await tx.workspaceMember.create({
          data: {
            email,
            image,
            name: `${fullname} ${lastname}`,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
        projectMember = await tx.projectMember.create({
          data: {
            email,
            image,
            memberId: workspaceMember.id,
            name: `${fullname} ${lastname}`,
            projectId: newProject.id,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
      });
    });

    afterAll(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.workspace.deleteMany();
        await tx.project.deleteMany();
        await tx.channel.deleteMany();
        await tx.projectMember.deleteMany();
      });

      await prisma.$disconnect();
    });
    test('should return 400 if id are not valid ObjectId', async () => {
      const res = await app.request(
        `/workspace/project/join?projectId=${
          newProject.id
        }&workspaceId=${12345566}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );

      expect(res.status).toBe(400);
    });

    test('should return 404 workspaceId or projectId not found', async () => {
      const id = new ObjectId().toHexString();
      const res = await app.request(
        `/workspace/project/join?projectId=${id}&workspaceId=${id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(404);
    });

    test('should return 404 if user is not a member of the workspace', async () => {
      const filtered_members = newWorkspace.members.filter(
        (member: string) => member !== userData.data.id
      );

      await prisma.workspace.update({
        where: { id: newWorkspace.id },
        data: { members: filtered_members },
      });
      const res = await app.request(
        `/workspace/project/join?projectId=${newProject.id}&workspaceId=${newWorkspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(404);
    });

    test('should return 404 if user workspace membership is not found', async () => {
      await prisma.workspaceMember.delete({
        where: { id: workspaceMember.id },
      });
      const res = await app.request(
        `/workspace/project/join?projectId=${newProject.id}&workspaceId=${newWorkspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(404);
    });

    test('should return 200 if user is already a member of the project', async () => {
      const res = await app.request(
        `/workspace/project/join?projectId=${newProject.id}&workspaceId=${newWorkspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(200);
    });

    test('should return 200 if user is a workspace member and not a project member', async () => {
      await prisma.projectMember.delete({ where: { id: projectMember.id } });
      const res = await app.request(
        `/workspace/project/join?projectId=${newProject.id}&workspaceId=${newWorkspace.id}`,
        {
          method: 'GET',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(200);
      const response = await res.json();
      expect(response.data.members).toContain(workspaceMember.id);
    });
  });

  describe('POST /workspace/project/me/leave', () => {
    let newWorkspace;
    let newProject;
    let workspaceMember;
    let projectMember;

    beforeEach(async () => {
      await prisma.$transaction(async (tx) => {
        newWorkspace = await tx.workspace.create({
          data: {
            name: 'test workspace',
            totalMembers: 1,
            members: [userData.data.id],
            owner: userData.data.id,
          },
        });

        newProject = await tx.project.create({
          data: {
            name: 'new project',
            purpose: '4 testing',
            createdAt: new Date(),
            workspaceId: newWorkspace.id,
            creator: userData.data.id,
            visibility: false,
          },
        });
        const { email, image, fullname, lastname, id } = userData.data;

        workspaceMember = await tx.workspaceMember.create({
          data: {
            email,
            image,
            name: `${fullname} ${lastname}`,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
        projectMember = await tx.projectMember.create({
          data: {
            email,
            image,
            memberId: workspaceMember.id,
            name: `${fullname} ${lastname}`,
            projectId: newProject.id,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
      });
    });

    afterAll(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.workspace.deleteMany();
        await tx.project.deleteMany();
        await tx.channel.deleteMany();
        await tx.projectMember.deleteMany();
      });

      await prisma.$disconnect();
    });
    test('should return status code of 400 if payload is bad', async () => {
      const res = await app.request('/workspace/project/me/leave', {
        method: 'DELETE',
        body: JSON.stringify({}),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return status code of 500 if member userId or projectId  is bad', async () => {
      const res = await app.request('/workspace/project/me/leave', {
        method: 'DELETE',
        body: JSON.stringify({
          projectMembershipId: new ObjectId().toHexString(),
          workspaceMembershipId: new ObjectId().toHexString(),
          projectID: newProject.id,
        }),
        headers: {
          'Content-Type': 'application/json',
          Cookie: user.headers.get('set-cookie'),
        },
      });
      console.log(await res.json());
      expect(res.status).toBe(500);
    });

    test('should successfully remove a member from a project and their workspace membership', async () => {
      const res = await app.request('/workspace/project/me/leave', {
        method: 'DELETE',
        body: JSON.stringify({
          projectID: newProject.id,
          projectMembershipId: projectMember.id,
          workspaceMembershipId: workspaceMember.id,
        }),
        headers: {
          'Content-Type': 'application/json',
          Cookie: user.headers.get('set-cookie'),
        },
      });

      expect(res.status).toBe(200);
    });

    test('should return 400 if required fields are missing', async () => {
      const res = await app.request('/workspace/project/me/leave', {
        method: 'DELETE',
        body: JSON.stringify({}), // Missing all fields
        headers: {
          'Content-Type': 'application/json',
          Cookie: user.headers.get('set-cookie'),
        },
      });

      expect(res.status).toBe(400);
    });

    test('should return 500 if project ID is invalid', async () => {
      const res = await app.request('/workspace/project/me/leave', {
        method: 'DELETE',
        body: JSON.stringify({
          projectID: new ObjectId().toHexString(), // non-existent
          projectMembershipId: projectMember.id,
          workspaceMembershipId: workspaceMember.id,
        }),
        headers: {
          'Content-Type': 'application/json',
          Cookie: user.headers.get('set-cookie'),
        },
      });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /workspace/project/member/remove', () => {
    let newWorkspace;
    let newProject;
    let workspaceMember;
    let projectMember;

    beforeEach(async () => {
      await prisma.$transaction(async (tx) => {
        newWorkspace = await tx.workspace.create({
          data: {
            name: 'test workspace',
            totalMembers: 1,
            members: [userData.data.id],
            owner: userData.data.id,
          },
        });

        newProject = await tx.project.create({
          data: {
            name: 'new project',
            purpose: '4 testing',
            createdAt: new Date(),
            workspaceId: newWorkspace.id,
            creator: userData.data.id,
            visibility: false,
          },
        });
        const { email, image, fullname, lastname, id } = userData.data;

        workspaceMember = await tx.workspaceMember.create({
          data: {
            email,
            image,
            name: `${fullname} ${lastname}`,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
        projectMember = await tx.projectMember.create({
          data: {
            email,
            image,
            memberId: workspaceMember.id,
            name: `${fullname} ${lastname}`,
            projectId: newProject.id,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
      });
    });

    afterAll(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.workspace.deleteMany();
        await tx.project.deleteMany();
        await tx.channel.deleteMany();
        await tx.projectMember.deleteMany();
      });

      await prisma.$disconnect();
    });

    test('should successfully remove a member', async () => {
      const res = await app.request('/workspace/project/member/remove', {
        method: 'DELETE',
        body: JSON.stringify({
          projectMembershipId: projectMember.id,
          workspaceMembershipId: workspaceMember.id,
          projectID: newProject.id,
          username: userData.data.firstname,
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      console.log(await res.json());
      expect(res.status).toBe(200);

      const removedMember = await prisma.projectMember.findUnique({
        where: { id: projectMember.id },
      });
      expect(removedMember).toBeNull();
    });
    test('should return status code of 400 if payload is bad', async () => {
      const res = await app.request('/workspace/project/member/remove', {
        method: 'DELETE',
        body: JSON.stringify({}),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return status code of 404 if any membershipId or projectId is not attached to any member or project', async () => {
      const res = await app.request('/workspace/project/member/remove', {
        method: 'DELETE',
        body: JSON.stringify({
          projectMembershipId: projectMember.id,
          workspaceMembershipId: new ObjectId().toHexString(),
          projectID: newProject.id,
          username: userData.data.firstname,
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(404);
    });

    test('should return 401 if who is trying to remove a member is not the project admin', async () => {
      await app.request('/auth/logout', {
        method: 'DELETE',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      await auth.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'kaliknight@gmail.com',
          password: '123456789assdsA',
          firstname: 'tester',
          lastname: 'peter',
        }),
      });
      const newUser = await auth.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'kaliknight@gmail.com',
          password: '123456789assdsA',
        }),
        headers: new Headers({ Content_Type: 'application/json' }),
      });
      const res = await app.request('/workspace/project/member/remove', {
        method: 'DELETE',
        body: JSON.stringify({
          projectMembershipId: projectMember.id,
          workspaceMembershipId: workspaceMember.id,
          projectID: newProject.id,
          username: userData.data.firstname,
        }),
        headers: { Cookie: newUser.headers.get('set-cookie') },
      });

      expect(res.status).toBe(401);
    });

    // test('should successfully remove a member', async () => {
    //   const res = await app.request('/workspace/project/member/remove', {
    //     method: 'DELETE',
    //     body: JSON.stringify({
    //       projectMembershipId: projectMember.id,
    //       workspaceMembershipId: workspaceMember.id,
    //       projectID: newProject.id,
    //       username: userData.data.firstname,
    //     }),
    //     headers: { Cookie: user.headers.get('set-cookie') },
    //   });

    //   console.log(await res.json());
    //   expect(res.status).toBe(200);

    //   const removedMember = await prisma.projectMember.findUnique({
    //     where: { id: projectMember.id },
    //   });
    //   expect(removedMember).toBeNull();
    // });
  });
  describe('POST /workspace/project/invitation', () => {
    let newWorkspace;
    let newProject;

    beforeEach(async () => {
      await prisma.$transaction(async (tx) => {
        newWorkspace = await tx.workspace.create({
          data: {
            name: 'test workspace',
            totalMembers: 1,
            members: [userData.data.id],
            owner: userData.data.id,
          },
        });

        newProject = await tx.project.create({
          data: {
            name: 'new project',
            purpose: '4 testing',
            createdAt: new Date(),
            workspaceId: newWorkspace.id,
            creator: userData.data.id,
            visibility: false,
          },
        });
      });
    });

    afterAll(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.workspace.deleteMany();
        await tx.project.deleteMany();
        await tx.channel.deleteMany();
        await tx.projectMember.deleteMany();
      });

      await prisma.$disconnect();
    });
    test('should return status code of 200 if projectId and role is given', async () => {
      const res = await app.request('/workspace/project/invitation', {
        method: 'POST',
        body: JSON.stringify({
          projectId: newProject.id,
          role: 'editor',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(200);
    });

    test('should return status code of 400 if projectId is bad', async () => {
      const res = await app.request('/workspace/project/invitation', {
        method: 'POST',
        body: JSON.stringify({
          projectId: '123456789oh',
          role: 'editor',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
    });

    test('should return status code of 404 is project is not found', async () => {
      await prisma.project.delete({ where: { id: newProject.id } });
      const res = await app.request('/workspace/project/invitation', {
        method: 'POST',
        body: JSON.stringify({
          projectId: newProject.id,
          role: 'editor',
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /workspace/project/:projectId', () => {
    let newWorkspace;
    let project;
    beforeAll(async () => {
      newWorkspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });

      const projectRes = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: newWorkspace.id,
          name: 'Project one',
          purpose: 'For testing purpose',
          visibility: false,
          members: [
            {
              name: 'Joe Frazier',
              image: 'http://image.unknown.com',
              userId: userData.data.id,
              email: userData.data.email,
              workspaceId: newWorkspace.id,
              memberId: new ObjectId(),
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      project = await projectRes.json();
    });
    test('should return 500 if payload is empty or bad', async () => {
      const res = await app.request(`/workspace/project/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ joe: 'frazier' }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(500);
    });

    test('should return 500 if payload is empty or bad', async () => {
      const res = await app.request(
        `/workspace/project/${new ObjectId().toHexString()}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: ' Joe frazier' }),
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(404);
    });

    test('should return 200 if payload is okay and project exists', async () => {
      const projectRes = await app.request(`/workspace/project`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: newWorkspace.id,
          name: 'Project one',
          purpose: 'For testing purpose',
          visibility: false,
          members: [
            {
              name: 'Joe Frazier',
              image: 'http://image.unknown.com',
              userId: userData.data.id,
              email: userData.data.email,
              workspaceId: newWorkspace.id,
              memberId: new ObjectId(),
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      const project = await projectRes.json();

      const res = await app.request(`/workspace/project/${project.data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Project two' }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /workspace/project/role', () => {
    let workspace;
    let workspaceMember;
    let project;
    let projectMember;

    afterEach(async () => {
      await prisma.workspace.deleteMany();
      await prisma.workspaceMember.deleteMany();
      await prisma.project.deleteMany();
      await prisma.projectMember.deleteMany();
    });
    beforeEach(async () => {
      // Create a workspace
      const res = await app.request('/workspace', {
        method: 'POST',
        body: JSON.stringify({ name: 'tester workspace' }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      workspace = await res.json();
      console.log(workspace);

      // Get the current user’s workspace membership
      workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: userData.data.id,
          workspaceId: workspace['data']['id'],
        },
      });

      // Create a project
      const projectRes = await app.request('/workspace/project', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: workspace.data.id,
          name: 'Project one',
          purpose: 'For testing purpose',
          members: [
            {
              name: 'peter',
              email: 'peterparker@gmail.com',
              image: 'http:///peter',
              memberId: workspaceMember.id,
              workspaceId: workspace.data.id,
              userId: userData.data.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      project = await projectRes.json();
      // Get project member created
      projectMember = await prisma.projectMember.findFirst({
        where: { projectId: project.data.id, userId: userData.data.id },
      });
    });

    test('should return 400 for invalid payload', async () => {
      const res = await app.request('/workspace/project/role', {
        method: 'POST',
        body: JSON.stringify({
          projectMembers: [{ projectMembershipId: 'some-id' }],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toBeDefined();
    });

    test('should return 404 if project is not found', async () => {
      const res = await app.request('/workspace/project/role', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: workspace.id,
          projectId: new ObjectId().toHexString(), // Non-existent project ID
          projectMembers: [
            {
              role: 'viewer',
              projectMembershipId: projectMember.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.message).toBe('Project not found');
    });

    test('should successfully update project member roles', async () => {
      const res = await app.request('/workspace/project/role', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: workspace.data.id,
          projectId: project.data.id,
          projectMembers: [
            {
              role: 'viewer',
              projectMembershipId: projectMember.id,
            },
          ],
          workspaceMembers: [
            {
              userId: userData.data.id,
              memberId: workspaceMember.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      const json = await res.json();
      console.log(json);
      expect(res.status).toBe(200);

      // expect(json.message).toBe('Operation completed successfully');

      const updated = await prisma.projectMember.findUnique({
        where: { id: projectMember.id },
      });
      expect(updated.role).toBe('viewer');
    });
  });

  describe('POST /workspace/channel/', () => {
    let newWorkspace;
    let newProject;
    let projectMember;

    beforeEach(async () => {
      await prisma.$transaction(async (tx) => {
        newWorkspace = await tx.workspace.create({
          data: {
            name: 'test workspace',
            totalMembers: 1,
            members: [userData.data.id],
            owner: userData.data.id,
          },
        });

        newProject = await tx.project.create({
          data: {
            name: 'new project',
            purpose: '4 testing',
            createdAt: new Date(),
            workspaceId: newWorkspace.id,
            creator: userData.data.id,
            visibility: false,
          },
        });
        const { email, image, fullname, lastname, id } = userData.data;

        const workspaceMember = await tx.workspaceMember.create({
          data: {
            email,
            image,
            name: `${fullname} ${lastname}`,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
        projectMember = await tx.projectMember.create({
          data: {
            email,
            image,
            memberId: workspaceMember.id,
            name: `${fullname} ${lastname}`,
            projectId: newProject.id,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
      });
    });

    afterAll(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.workspace.deleteMany();
        await tx.project.deleteMany();
        await tx.channel.deleteMany();
        await tx.projectMember.deleteMany();
      });

      await prisma.$disconnect();
    });
    test('should return 400 if data is bad or incomplete', async () => {
      const res = await app.request(`/workspace/channel`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 404 workspaceIds and projectIds are invalid', async () => {
      //  const  await
      const res = await app.request(`/workspace/channel`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: '34343434',
          projectId: '1123434343434',
          name: 'Channel 4 testers',
          members: [
            {
              name: `${userData.data.firstname} ${userData.data.lastname}`,
              image: userData.data.image,
              userId: userData.data.id,
              email: userData.data.email,
              workspaceId: newWorkspace.id,
              memberId: projectMember.id,
              projectId: newProject.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(404);
    });

    test('should return 404 if workspace or project is deleted', async () => {
      //  const  await
      await prisma.workspace.delete({ where: { id: newWorkspace.id } });
      await prisma.project.delete({ where: { id: newProject.id } });
      await prisma.projectMember.delete({ where: { id: projectMember.id } });
      const res = await app.request(`/workspace/channel`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: newWorkspace.id,
          projectId: newProject.id,
          name: 'Channel 4 testers',
          members: [
            {
              name: `${userData.data.firstname} ${userData.data.lastname}`,
              image: userData.data.image,
              userId: userData.data.id,
              email: userData.data.email,
              workspaceId: newWorkspace.id,
              memberId: projectMember.id,
              projectId: newProject.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(500);
    });

    test('should return 200 when creating channel', async () => {
      //   {
      //     name?: string;
      //     image?: string;
      //     userId?: string;
      //     email?: string;
      //     workspaceId?: string;
      //     memberId?: string;
      //     projectId?: string;
      // }
      const res = await app.request(`/workspace/channel`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: newWorkspace.id,
          projectId: newProject.id,
          name: 'Channel 4 testers',
          members: [
            {
              name: `${userData.data.firstname} ${userData.data.lastname}`,
              image: userData.data.image,
              userId: userData.data.id,
              email: userData.data.email,
              workspaceId: newWorkspace.id,
              memberId: projectMember.id,
              projectId: newProject.id,
            },
          ],
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(200);
    });
  });

  describe(' (CONT...) POST /workspace/channel/ ', () => {
    let newWorkspace;
    let newProject;
    let newChannel;
    let projectMember;
    beforeEach(async () => {
      await prisma.$transaction(async (tx) => {
        newWorkspace = await tx.workspace.create({
          data: {
            name: 'test workspace',
            totalMembers: 1,
            members: [userData.data.id],
            owner: userData.data.id,
          },
        });

        newProject = await tx.project.create({
          data: {
            name: 'new project',
            purpose: '4 testing',
            createdAt: new Date(),
            workspaceId: newWorkspace.id,
            creator: userData.data.id,
            visibility: false,
          },
        });
        const { email, image, fullname, lastname, id } = userData.data;

        const workspaceMember = await tx.workspaceMember.create({
          data: {
            email,
            image,
            name: `${fullname} ${lastname}`,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });
        projectMember = await tx.projectMember.create({
          data: {
            email,
            image,
            memberId: workspaceMember.id,
            name: `${fullname} ${lastname}`,
            projectId: newProject.id,
            userId: id,
            workspaceId: newWorkspace.id,
          },
        });

        newChannel = await tx.channel.create({
          data: {
            name: 'new project',
            projectId: newProject.id,
            workspaceId: newWorkspace.id,
            admin: userData.data.id,
          },
        });
      });
    });

    afterEach(async () => {
      await prisma.workspace.deleteMany();
      await prisma.project.deleteMany();
      await prisma.$disconnect();
    });

    test('should return 400 if updateChannel data is invalid', async () => {
      const res = await app.request(`/workspace/channel/${newChannel.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 1 }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 404 if updating a non-existent channel', async () => {
      const res = await app.request(`/workspace/channel/invalidId`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(404);
    });
    //   // NOTE: False Failing test below ⤵️
    //   // test('should return 200 if user successfully joins a public channel', async () => {
    //   //   const res = await workspace.request(
    //   //     `/workspace/channel/join/${newChannel.id}/${userData.data.id}`,
    //   //     {
    //   //       method: 'POST',
    //   //       headers: { Cookie: user.headers.get('set-cookie') },
    //   //     }
    //   //   );
    //   //   console.log(await res.json());
    //   //   expect(res.status).toBe(200);
    //   // });

    test('should return 404 if joining a non-existent channel', async () => {
      const res = await app.request(
        `/workspace/channel/join/invalidChannelId/user123`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(404);
    });

    test('should return 200 when leaving a channel successfully', async () => {
      const res = await app.request(
        `/workspace/channel/leave/${newChannel.id}/${userData.data.id}`,
        {
          method: 'POST',
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(200);
    });

    test('should return 200 when sending a join channel request successfully', async () => {
      const res = await app.request(`/workspace/channel/request`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Kelvin Chukwu',
          toAdmin: 'admin123',
          channelId: newChannel.id,
          workspaceId: newWorkspace.id,
          channelName: newChannel.name,
          projectId: newProject.id,
          projectMembershipId: projectMember.id,
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(res.status).toBe(200);
    });

    test('should return 400 if join request data is invalid', async () => {
      const res = await app.request(`/workspace/channel/request`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });

    test('should return 200 when accepting a join request', async () => {
      const req = await app.request(`/workspace/channel/request`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Kelvin Chukwu',
          toAdmin: 'admin123',
          channelId: newChannel.id,
          workspaceId: newWorkspace.id,
          channelName: newChannel.name,
          projectId: newProject.id,
          projectMembershipId: projectMember.id,
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });

      expect(req.status).toBe(200);
      const res = await app.request(
        `/workspace/channel/request/action?userId=${userData.data.id}&channelId=${newChannel.id}&signal=accept&workspaceId=${newWorkspace.id}&projectId=${newProject.id}&projectMembershipId=${projectMember.id}`,
        {
          method: 'POST',
          body: JSON.stringify({
            signal: 'revoke',
            userId: userData.data.id,
            channelId: newChannel.id,
          }),
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(200);
    });

    test('should return 200 when revoking a join request', async () => {
      const req = await app.request(`/workspace/channel/request`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Kelvin Chukwu',
          toAdmin: 'admin123',
          channelId: newChannel.id,
          workspaceId: newWorkspace.id,
          channelName: newChannel.name,
          projectId: newProject.id,
          projectMembershipId: projectMember.id,
        }),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(req.status).toBe(200);
      const res = await app.request(
        `/workspace/channel/request/action?userId=${userData.data.id}&channelId=${newChannel.id}&signal=reject&workspaceId=${newWorkspace.id}&projectId=${newProject.id}&projectMembershipId=${projectMember.id}`,
        {
          method: 'POST',
          body: JSON.stringify({
            signal: 'revoke',
            userId: userData.data.id,
            channelId: newChannel.id,
          }),
          headers: { Cookie: user.headers.get('set-cookie') },
        }
      );
      expect(res.status).toBe(200);
    });

    test('should return 400 if request action data is invalid', async () => {
      const res = await app.request(`/workspace/channel/request/action`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      expect(res.status).toBe(400);
    });
  });

  // describe('POST /workspace/chat/artificium', () => {
  //   let threadres: any;
  //   let thread: any;
  //   beforeEach(async () => {
  //     await prisma.artificiumChat.deleteMany();
  //     threadres = await app.request(`/workspace/chat/thread`, {
  //       method: 'POST',
  //       headers: { Cookie: user.headers.get('set-cookie') },
  //     });
  //     thread = await threadres.json();
  //   });
  //   // test('should return 200 when sending a valid message to artificium', async () => {
  //   //   const res = await app.request('/workspace/chat/artificium', {
  //   //     method: 'POST',
  //   //     body: JSON.stringify({
  //   //       projectId: '85830204820',
  //   //       userId: '02893453928',
  //   //       text: "What's your name?",
  //   //       user: 'HUMAN',
  //   //       threadId: thread.data.threadID,
  //   //     }),
  //   //     headers: {
  //   //       Cookie: user.headers.get('set-cookie'),
  //   //     },
  //   //   });

  //   //   expect(res.status).toBe(200);
  //   //   const chat = await prisma.artificiumChat.findMany();
  //   //   expect(chat.length).toBe(0);
  //   // });

  //   // test('should return 400 when required fields are missing', async () => {
  //   //   const res = await app.request('/workspace/chat/artificium', {
  //   //     method: 'POST',
  //   //     body: JSON.stringify({
  //   //       userId: '02893453928', // projectId and text are missing
  //   //     }),
  //   //     headers: {
  //   //       Cookie: user.headers.get('set-cookie'),
  //   //     },
  //   //   });

  //   //   expect(res.status).toBe(400);
  //   // });

  //   // test('should return 400 when payload is invalid (wrong types)', async () => {
  //   //   const res = await app.request('/workspace/chat/artificium', {
  //   //     method: 'POST',
  //   //     body: JSON.stringify({
  //   //       projectId: 85830204820, // should be string
  //   //       userId: '02893453928',
  //   //       text: 123, // should be string
  //   //       user: 'HUMAN',
  //   //     }),
  //   //     headers: {
  //   //       Cookie: user.headers.get('set-cookie'),
  //   //     },
  //   //   });

  //   //   expect(res.status).toBe(400);
  //   // });

  //   // test('should return 401 if no auth cookie is provided', async () => {
  //   //   const res = await app.request('/workspace/chat/artificium', {
  //   //     method: 'POST',
  //   //     body: JSON.stringify({
  //   //       projectId: '85830204820',
  //   //       userId: '02893453928',
  //   //       text: "What's your name?",
  //   //       user: 'HUMAN',
  //   //     }),
  //   //     // Missing Cookie header
  //   //   });

  //   //   expect(res.status).toBe(401);
  //   // });
  // });

  describe('GET /workspace/chat/artificium?projectId=&userId=', () => {
    let threadres: any;
    let thread: any;
    let new_workspace: any;
    let projectId: any;
    let artificium_id: any;
    beforeEach(async () => {
      threadres = await app.request(`/workspace/chat/thread`, {
        method: 'POST',
        headers: { Cookie: user.headers.get('set-cookie') },
      });
      thread = await threadres.json();
      new_workspace = await prisma.workspace.create({
        data: {
          name: 'test workspace',
          totalMembers: 1,
          members: [userData.data.id],
          owner: userData.data.id,
        },
      });
      const memberShipID = await prisma.workspaceMember.create({
        data: {
          email: userData.data.email,
          image: userData.data.image,
          name: userData.data.firstname + ' ' + userData.data.lastname,
          userId: userData.data.id,
          workspaceId: new_workspace.id,
        },
      });

      const project = await prisma.project.create({
        data: {
          creator: userData.data.id,
          name: 'test project',
          workspaceId: new_workspace.id,
        },
      });

      projectId = project.id;
      const artificium = await prisma.artificium.create({
        data: {
          projectId: project.id,
          userId: userData.data.id,
          workspaceId: new_workspace.id,
        },
      });

      artificium_id = artificium.id;
    });
    afterAll(async () => {
      await prisma.artificiumChat.deleteMany();
    });
    test('should return 400 if projectId and userId are missing', async () => {
      const res = await app.request('/workspace/chat/artificium', {
        method: 'GET',
        headers: {
          Cookie: user.headers.get('set-cookie'),
        },
      });

      expect(res.status).toBe(400);
    });

    test('should return status code 200 and messages when projectId,userId, artificiumId,workspaceId and threadId are included', async () => {
      const userId = userData.data.id;

      await prisma.artificiumChat.create({
        data: {
          projectId,
          userId,
          text: 'Hello from db',
          timestamp: new Date(),
          user: 'HUMAN',
          threadId: thread.data.threadID,
          artificiumId: artificium_id,
          workspaceId: new_workspace.id,
        },
      });

      const res = await app.request(
        `/workspace/chat/artificium?projectId=${projectId}`,
        {
          method: 'GET',
          headers: {
            Cookie: user.headers.get('set-cookie'),
          },
        }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('message retrieved successfully');
      expect(json.data.length).toBeGreaterThan(0);
    });
  });

  // describe("")
});
