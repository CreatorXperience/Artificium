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
  Redis,
  updateArtificiumMessagePayloadSchema,
  deleteArtificiumMessageValidator,
  projectMemberValidator,
  projectRoleValidator,
  artificiumValidator,
  validateInvitePayload,
  makeAdminSchemaValidator,
  acceptOrRejectValidator,
  projectMemberRoleUpdateValidator,
} from '@org/database';
import { PrismaClient } from '@prisma/client';
import { Context } from 'hono';
import { ObjectId } from 'mongodb';
import logger from '../../utils/logger';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import EventEmitter from 'node:events';
const redis = new Redis();

redis
  .connect()
  .then(() => {
    logger.log({ level: 'info', message: 'connected to redis successfully' });
  })
  .catch((e) => {
    logger.log('error', `encountered an error while connecting to redis: \n ${e}`);
  });

const prisma = new PrismaClient();

class CustomEmitter extends EventEmitter { }

const customEmitter = new CustomEmitter();

const getAllUserWorkspace = async (c: Context) => {
  const userId = c.var.getUser().id;
  const publicWorkspace = await prisma.workspace.findMany({
    take: 20,
    where: { visibility: false, NOT: { owner: userId } },
  });

  const personalWorkspaces = await prisma.workspace.findMany({
    where: { owner: userId },
  });

  return c.json({
    messages: 'success',
    data: { personalWorkspaces, publicWorkspace },
  });
};

const getWorkspace = async (c: Context) => {
  const id = c.req.param('id');
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    return c.json({ message: 'workspace not found' }, 404)
  }

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

  let workspace;

  await prisma.$transaction(async (tx) => {
    const workspaceMember = await tx.workspaceMember.create({
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
      members: [owner],
      readAccess: [owner],
      writeAccess: [owner],
    };

    workspace = await tx.workspace.create({
      data: {
        ...workspaceObj,
      },
    });

    const projectId = new ObjectId().toHexString()

    const projectMember = await tx.projectMember.create({
      data: {
        email: user.email,
        image: user.image,
        memberId: workspaceMember.id,
        name: `${user.firstname} ${user.lastname}`,
        projectId,
        userId: owner,
        workspaceId: workspace.id,
        role: "owner"
      }
    })

    const project = await tx.project.create({
      data: {
        id: projectId,
        creator: owner,
        name: "Welcome",
        workspaceId: workspace.id,
        members: [workspaceMember.id],
        purpose: "A welcome project",
      }
    })

    const channel = await tx.channel.create({
      data: {
        admin: owner,
        name: " 👋🏼 Welcome Channel",
        projectId: project.id,
        workspaceId: workspace.id,
        members: [projectMember.id]
      }
    })

    await tx.channelMember.create({
      data: {
        channelId: channel.id,
        email: user.email,
        image: user.image,
        memberId: projectMember.id,
        name: `${user.firstname} ${user.lastname}`,
        projectId,
        userId: owner,
        workspaceId: workspace.id,
        role: "owner"
      }
    })



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

const getLoggedInUserWorkspaceMembership = async (c: Context) => {
  const userID = c.var.getUser().id;
  const workspaceID = c.req.param().workspaceId;

  const [workspace, membership] = await prisma.$transaction([
    prisma.workspace.findFirst({ where: { id: workspaceID } }),
    prisma.workspaceMember.findFirst({
      where: { userId: userID, workspaceId: workspaceID },
    }),
  ]);
  if (!workspace) {
    return c.json({ message: 'workspace not found' }, 404);
  }
  if (!membership) {
    return c.json({ message: 'membership not found' }, 404);
  }
  return c.json({
    message: 'membership retrieved successfully',
    data: membership,
  });
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

  const [member, workspace] = await prisma.$transaction([
    prisma.workspaceMember.findFirst({
      where: { userId: userID, workspaceId: workspaceId },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
    }),
  ]);

  if (!workspace) {
    c.status(404);
    return c.json({ message: 'workspace not found' });
  }
  if (member) {
    c.status(201);
    return c.json({ message: 'user is already a member of this workspace' });
  }

  const user = c.var.getUser();
  let updatedWorkspace;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.workspaceMember.create({
        data: {
          email: user.email,
          image: user.image,
          name: `${user.firstname} ${user.lastname}`,
          userId: userID,
          workspaceId: workspaceId,
        },
      });

      updatedWorkspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: { members: [...workspace.members, userID] },
      });
    });
  } catch (e) {
    return c.json({ message: 'an error occured while joining workspace' }, 500);
  }

  return c.json({
    message: 'your are now a member of this workspace',
    data: updatedWorkspace,
  });
};

const leaveworkspace = async (c: Context) => {
  const workspaceId = c.req.query('workspaceId');
  const user = c.var.getUser();
  const userID = (c.req.query('userId') as string) || (user.id as string);

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
    return c.json({ message: 'workspace not found' });
  }

  const filteredMembers = workspace.members.filter((item) => item !== userID);

  await prisma.$transaction(async () => {
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
  const { id: creatorId } = c.var.getUser();
  const body: TProject = await c.req.json();
  const validation = projectValidator(body);

  if (validation.error) {
    return c.json(
      {
        message: `Validation error: ${validation.error.errors[0].message}`,
      },
      400
    );
  }

  const { data } = validation;

  if (!ObjectId.isValid(data.workspaceId)) {
    return c.json({ message: 'Malformed ObjectId' }, 400);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: data.workspaceId },
  });

  if (!workspace) {
    return c.json({ message: 'No workspace found for this ObjectId' }, 404);
  }

  const projectId = new ObjectId().toHexString();
  const memberIds: string[] = [];

  if (data.members?.length) {
    const memberCreates = data.members.map((member) => {
      memberIds.push(member.memberId);
      return prisma.projectMember.create({
        data: {
          image: member.image,
          name: member.name,
          projectId,
          memberId: member.memberId,
          workspaceId: member.workspaceId,
          email: member.email,
          userId: member.userId,
        },
      });
    });
    await Promise.all(memberCreates);
  }

  const { members, ...projectData } = data;

  const project = await prisma.project.create({
    data: {
      id: projectId,
      creator: creatorId,
      members: memberIds,
      ...projectData,
    },
  });

  return c.json({ message: 'Project successfully created', data: project });
};

const getProjectMembership = async (c: Context) => {
  const param = c.req.query();
  const workspaceId = param['workspaceId'];
  const projectId = param['projectId'];
  const memberId = param['workspaceMembershipId'];

  if (
    ObjectId.isValid(workspaceId) &&
    ObjectId.isValid(projectId) &&
    ObjectId.isValid(memberId)
  ) {
    const workspaceMembership = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!workspaceMembership) {
      return c.json({ message: 'workspace membership not found' }, 404);
    }
    const projectMembership = await prisma.projectMember.findFirst({
      where: {
        workspaceId,
        projectId,
        memberId,
      },
    });

    if (!projectMembership) {
      return c.json(
        { message: 'you are not a member of this project.', data: null },
        404
      );
    }
    return c.json({
      message: 'project membership retrieved successfully',
      data: projectMembership,
    });
  }
  return c.json({ message: "Invalid params id's" }, 400);
};

// TODO: GET  USER controller

const joinProject = async (c: Context) => {
  const user = c.var.getUser();
  const userId = user.id;
  const { projectId, workspaceId } = c.req.query();

  // Validate IDs
  if (!ObjectId.isValid(projectId) || !ObjectId.isValid(workspaceId)) {
    return c.json({ message: 'Invalid project or workspace ID' }, 400);
  }

  const [project, workspace] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
  ]);

  if (!project) return c.json({ message: 'Project not found' }, 404);
  if (!workspace) return c.json({ message: 'Workspace not found' }, 404);

  if (!workspace.members.includes(userId)) {
    return c.json({ message: "You don't belong to this workspace" }, 404);
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (!workspaceMember) {
    return c.json({ message: 'workspace membership not found' }, 404);
  }

  const existingMember = await prisma.projectMember.findFirst({
    where: { memberId: workspaceMember.id, projectId },
  });
  if (existingMember) {
    return c.json({
      message: 'Already a member of this project',
      projectMembership: existingMember,
    });
  }

  let projectMembership, updatedProject;
  await prisma.$transaction(async (tx) => {
    projectMembership = await tx.projectMember.create({
      data: {
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
        image: user.image,
        projectId,
        workspaceId,
        memberId: workspaceMember.id,
        userId,
      },
    });

    const updatedMembers = project.members.includes(workspaceMember.id)
      ? project.members
      : [...project.members, workspaceMember.id];

    updatedProject = await tx.project.update({
      where: { id: projectId },
      data: { members: updatedMembers },
    });
  });
  return c.json({
    message: `You have joined the project: ${updatedProject.name}`,
    data: updatedProject,
    projectMembership,
  });
};

const invitationWithLink = async (c: Context) => {
  const { image, email, firstname, lastname, id } = c.var.getUser();
  const userId = id;
  const body = await c.req.json();
  const { error, data } = validateInvitePayload(body);
  if (error) {
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }

  if (!ObjectId.isValid(data.projectId)) {
    return c.json({ message: 'invalid project id' }, 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });
  if (!project) return c.json({ message: 'project not found' }, 404);
  let membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId: project.workspaceId },
  });

  await prisma.$transaction(async (tx) => {
    if (!membership) {
      membership = await tx.workspaceMember.create({
        data: {
          email,
          image,
          name: `${firstname} ${lastname}`,
          userId,
          workspaceId: project.workspaceId,
        },
      });

      await tx.workspace.update({ where: { id: project.workspaceId }, data: { members: { push: userId } } })
    }

    let projectMember = await tx.projectMember.findFirst({
      where: {
        userId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        memberId: membership.id,
      },
    });
    if (!projectMember) {
      projectMember = await tx.projectMember.create({
        data: {
          email,
          image,
          name: `${firstname} ${lastname}`,
          userId,
          workspaceId: project.workspaceId,
          memberId: membership.id,
          projectId: project.id,
          role: data.role,
        },
      });
    }

    await tx.project.update({
      where: {
        id: data.projectId,
      },
      data: { members: [...project.members, membership.id] },
    });
  });

  return c.json({ message: 'you are now a member of this project' });
};

const leaveProject = async (c: Context) => {
  const user = c.var.getUser();
  const userId = user.id;

  const body = await c.req.json();

  const { data, error } = projectMemberValidator(body);

  if (error) {
    return c.json(
      { message: `Validation Error: ${error.errors[0].message}` },
      400
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: data.projectID },
        select: { members: true },
      });
      if (!project) {
        throw new Error('project not found');
      }
      const workspaceMember = await tx.workspaceMember.findUnique({
        where: { id: data.workspaceMembershipId, userId },
      });
      if (!workspaceMember) {
        throw new Error('Workspace membership not found');
      }

      const updatedMembers = project.members.filter(
        (id) => id !== workspaceMember.id
      );

      await tx.project.update({
        where: { id: data.projectID },
        data: { members: updatedMembers },
      });

      // 4. Delete the project member
      await tx.projectMember.delete({
        where: { id: data.projectMembershipId },
      });

      // 5. Delete channel memberships
      await tx.channelMember.deleteMany({
        where: {
          memberId: data.projectMembershipId,
          projectId: data.projectID,
        },
      });

      // 6. Update all channels where this member was included
      const affectedChannels = await tx.channel.findMany({
        where: {
          members: { hasSome: [data.projectMembershipId] },
        },
        select: { id: true, members: true },
      });

      await Promise.all(
        affectedChannels.map((channel) => {
          const updated_members = channel.members.filter(
            (id) => id !== data.projectMembershipId
          );
          return tx.channel.update({
            where: { id: channel.id },
            data: { members: updated_members },
          });
        })
      );



    });

    return c.json({
      message: `${user.firstname} ${user.lastname} has been removed from this project`,
    });
  } catch (err) {
    console.error(err);
    return c.json({ message: err.message }, 500);
  }
};

const removeProjectMember = async (c: Context) => {
  const userId = c.var.getUser().id;
  const body = await c.req.json();
  const { data, error } = projectMemberValidator(body);
  if (error) {
    return c.json(`Validation Error:  ${error.errors[0].message}`, 400);
  }
  const project = await prisma.project.findUnique({
    where: { id: data.projectID },
  });

  if (project.creator !== userId) {
    return c.json(
      {
        message: "sorry, you can't remove a member unless you're an admin",
      },
      401
    );
  }

  const [projectMembership, workspaceMembership] = await Promise.all([
    prisma.projectMember.findUnique({
      where: { id: data.projectMembershipId, projectId: data.projectID },
    }),
    prisma.workspaceMember.findUnique({
      where: {
        id: data.workspaceMembershipId,
      },
    }),
  ]);

  if (!projectMembership)
    return c.json({ message: 'project membership not found' }, 404);

  if (!workspaceMembership)
    return c.json({ message: 'workspace membership not found' }, 404);

  const filter_members = project.members.filter(
    (member) => member !== workspaceMembership.id
  );

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: {
        id: data.projectID,
      },
      data: { members: filter_members },
    });

    await tx.projectMember.delete({
      where: {
        id: projectMembership.id,
        projectId: data.projectID,
        memberId: data.workspaceMembershipId,
      },
    });

    const affectedChannels = await tx.channel.findMany({
      where: {
        members: { hasSome: [data.projectMembershipId] },
      },
      select: { id: true, members: true },
    });

    await Promise.all(
      affectedChannels.map((channel) => {
        const newMembers = channel.members.filter(
          (id) => id !== data.projectMembershipId
        );
        return tx.channel.update({
          where: { id: channel.id },
          data: { members: newMembers },
        });
      })
    );


    await tx.channelMember.deleteMany({
      where: {
        memberId: data.projectMembershipId,
        projectId: data.projectID
      }
    })
  });

  return c.json({
    message: `${data.username} has been removed from this project`,
  });
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

  const isProjectExist = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!isProjectExist) {
    return c.json({ message: "project doesn't exist" }, 404);
  }
  const project = await prisma.project.update({
    where: { id: projectId },
    data: data.data,
  });

  return c.json({ message: 'project updated successfully', data: project });
};

const inviteWorkspaceMemberToProject = async (c: Context) => {
  const body = await c.req.json();
  const { error, data } = projectRoleValidator(body);

  if (error) {
    return c.json({ message: error.errors[0].message }, 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    return c.json({ message: 'Project not found' }, 404);
  }

  const tasks: Promise<any>[] = [];

  if (data.workspaceMembers?.length > 0) {
    const notificationsData = data.workspaceMembers.map((member) => {
      const notificationId = new ObjectId().toHexString();

      tasks.push(
        prisma.notification.create({
          data: {
            id: notificationId,
            link: `${process.env.BASE_URL}/project/join?projectId=${data.projectId}&workspaceId=${project.workspaceId}`,
            text: `You are invited to ${project.name} project`,
            userId: member.userId,
          },
        })
      );

      return {
        userId: member.userId,
      };
    });

    // Defer emit until notifications are saved
    tasks.push(
      Promise.resolve().then(() => {
        customEmitter.emit(
          'inapp-notification',
          JSON.stringify(notificationsData)
        );
      })
    );
  }
  // Run all tasks concurrently
  if (tasks && tasks.length) {
    await Promise.all(tasks);
  }

  return c.json({ message: 'Operation completed successfully' });
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
    return c.json(
      { message: `Validation Error: ${error.errors[0].message}` },
      400
    );
  }

  if (
    !ObjectId.isValid(data.projectId) ||
    !ObjectId.isValid(data.workspaceId)
  ) {
    return c.json({ message: 'Invalid Id(s)' }, 404);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [project, workspace] = await Promise.all([
        tx.project.findUnique({ where: { id: data.projectId } }),
        tx.workspace.findUnique({ where: { id: data.workspaceId } }),
      ]);

      if (!project) {
        throw new Error('Invalid or bad project ID');
      }
      if (!workspace) {
        throw new Error('Invalid or bad workspace ID');
      }

      const channelId = new ObjectId().toHexString();
      const memberIds: string[] = [];

      if (data.members?.length) {
        await Promise.all(
          data.members.map(
            async ({
              email,
              image,
              memberId,
              name,
              userId,
              projectId,
              workspaceId,
            }) => {
              memberIds.push(memberId);
              await tx.channelMember.create({
                data: {
                  channelId,
                  email,
                  image,
                  memberId,
                  name,
                  userId,
                  projectId,
                  workspaceId,
                  role: userId === creator ? "owner" : "editor"
                },
              });
            }
          )
        );
      }

      const channel = await tx.channel.create({
        data: {
          id: channelId,
          ...data,
          admin: creator,
          members: memberIds,
        },
      });

      return channel;
    });

    return c.json({ message: 'Channel created successfully', data: result });
  } catch (err) {
    return c.json({ message: err.message || 'Internal Server Error' }, 500);
  }
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
    data: { ...data },
  });
  return c.json({ message: 'channel updated successfully', data: channel });
};
//CHECK JoinChannel Middleware
const joinChannel = async (c: Context) => {
  const { email, image, firstname, lastname, id } = c.var.getUser();
  const param = c.req.param();

  if (
    !ObjectId.isValid(param['channelId']) ||
    !ObjectId.isValid(param['projectMemberId'])
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

  const projectMembership = await prisma.projectMember.findUnique({
    where: { id: param['projectMemberId'] },
  });
  if (!projectMembership) {
    return c.json(
      {
        message:
          'you are not a member of the project where this channel belongs to',
      },
      404
    );
  }
  const channel = await prisma.channel.update({
    where: { id: param['channelId'] },
    data: { members: [...data.members, projectMembership.id] },
  });

  await prisma.channelMember.create({
    data: {
      email,
      image,
      name: `${firstname} ${lastname}`,
      channelId: data.id,
      memberId: projectMembership.id,
      projectId: projectMembership.projectId,
      userId: id,
      workspaceId: projectMembership.workspaceId,
    },
  });

  return c.json({ message: 'joined channel successfully', data: channel });
};

const leaveChannel = async (c: Context) => {
  const param = c.req.param();

  if (ObjectId.isValid(param['channelId']) && ObjectId.isValid(param['projectMemberId']) && ObjectId.isValid(param['channelMemberId'])) {
    const data = await prisma.channel.findUnique({
      where: { id: param['channelId'] },
    });

    if (!data) {
      return c.json({ message: 'channel not found' }, 404);
    }

    const filteredMember = data.members.filter(
      (item) => item !== param['projectMemberId']
    );

    let channel;

    await prisma.$transaction(async (tx) => {
      const [channelUpdate] = await Promise.all([
        tx.channel.update({
          where: { id: param['channelId'] },
          data: { members: filteredMember },
        }),

        tx.channelMember.delete({
          where: { id: param['channelMemberId'] },
        }),
      ]);

      channel = channelUpdate;
    });

    return c.json({ message: 'leaved channel successfully', data: channel });
  }
  else {
    return c.json({ message: "Invalid parameter" }, 400)
  }
};


// test this below !
const getChannelMembership = async (c: Context) => {
  const { userId, channelId, projectId, workspaceId } = c.req.query()
  if (ObjectId.isValid(userId) && ObjectId.isValid(channelId) && ObjectId.isValid(projectId) && ObjectId.isValid(workspaceId)) {
    const channelMember = await prisma.channelMember.findFirst({ where: { channelId, userId, projectId, workspaceId } })
    if (!channelMember) {
      return c.json({ message: "channel member not found" }, 404)
    }
    return c.json({ message: "channel membership retrieved successfully" })
  }
  return c.json({ message: "Invalid query Params" }, 400)

}

// test this below !
const getChannelMembers = async (c: Context) => {
  const { channelId } = c.req.param()
  const channelMembers = await prisma.channelMember.findMany({ where: { channelId } })

  return c.json({ message: "channel members retrieved sucessfully", data: channelMembers })
}


// test this below

const updateChannelMemberRole = async (c: Context) => {
  const { id: user } = c.var.getUser()
  const { channelId, channelMembershipId, role } = c.req.query()
  if (role !== "admin" && role !== "editor" && role !== "viewer") {
    return c.json({ message: "role must either be admin, editor or viewer" })
  }

  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) {
    return c.json({ message: "channel not found" }, 404)
  }

  if (channel.admin !== user) {
    return c.json({ message: "Permission denied, not an admin" }, 401)
  }

  const channelMember = await prisma.channelMember.findUnique({ where: { id: channelMembershipId } })
  if (!channelMember) {
    return c.json({ message: "channel member not found" }, 404)
  }
  await prisma.channelMember.update({ where: { id: channelMembershipId }, data: { role: role } })

}

const joinChannelRequest = async (c: Context) => {
  const user = c.var.getUser();
  const userId = user.id;
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

  let channelReq;
  try {
    await prisma.$transaction(async (tx) => {
      const [channelReq, notification] = await Promise.all([
        tx.joinChannelRequest.create({
          data: {
            name: `${user.firstname} ${user.lastname}`,
            toAdmin: data.toAdmin,
            userId: userId,
            channelId: data.channelId,
            workspaceId: data.workspaceId,
            projectId: data.projectId,
            projectMembershipId: data.projectMembershipId,
          },
        }),
        tx.notification.create({
          data: {
            link: `join-request?userId=${userId}&channelId=${data.channelId}&workspaceId=${data.workspaceId}&projectId=${data.projectId}&projectMembershipId=${data.projectMembershipId}`,
            text: `${user.name} sent a request to join ${data.channelName}`,
            userId: data.toAdmin,
          },
        }),
      ]);

      if (!channelReq) {
        throw new Error('🙆🏽‍♂️ Wahala Wahala Wahala');
      } else if (!notification) {
        throw new Error("notification wasn't created");
      }

      customEmitter.emit('inapp-notification', [
        JSON.stringify([{
          userId: data.toAdmin,
        }]),
      ]);
    });
  } catch (e) {
    return c.json({ message: e.message }, 500);
  }

  return c.json({
    message: 'join request successfully sent',
    data: channelReq,
  });
};

const acceptOrRevokeJoinChannelReq = async (c: Context) => {
  const adminId = c.var.getUser().id;
  const body = await c.req.json();


  const { error, data } = acceptOrRejectValidator(body)

  if (error) {
    return c.json({ message: `Validation Error ${error.errors[0].message}` }, 400)
  }

  const {
    userId,
    channelId,
    signal,
    workspaceId,
    projectId,
    projectMembershipId,
  } = data;

  if (!userId || !channelId || !signal) {
    return c.json({ message: 'Incomplete query parameters' }, 400);
  }

  if (!['accept', 'reject'].includes(signal)) {
    return c.json({ message: 'Invalid signal' }, 400);
  }

  if (signal === 'reject') {
    await prisma.joinChannelRequest.deleteMany({
      where: {
        channelId,
        toAdmin: adminId,
        userId: userId,
        workspaceId,
        projectMembershipId,
      },
    });
    return c.json(
      {
        message: 'Request to join channel has been revoked successfully',
      },
      200
    );
  }

  if (signal === 'accept') {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return c.json({ message: 'Channel not found' }, 404);
    }

    // Avoid duplicate members
    const updatedMembers = channel.members.includes(userId)
      ? channel.members
      : [...channel.members, userId];

    await prisma.$transaction(async (tx) => {
      await tx.channel.update({
        where: { id: channelId },
        data: { members: updatedMembers },
      });
      const user = await tx.user.findUnique({ where: { id: userId } });
      const { email, firstname, lastname, image } = user;
      await prisma.channelMember.create({
        data: {
          channelId,
          email,
          name: `${firstname} ${lastname}`,
          image,
          memberId: projectMembershipId,
          projectId: projectId,
          workspaceId: workspaceId,
          userId,
        },
      });
      await tx.joinChannelRequest.deleteMany({
        where: { channelId },
      });
    });

    return c.json(
      {
        message: 'Request to join channel has been accepted successfully',
      },
      200
    );
  }
};

const getArtificium = async (c: Context) => {
  const body = await c.req.json();
  const {
    error,
    data: { projectId, userId, workspaceId },
  } = artificiumValidator(body);
  if (error) {
    return c.json(
      { message: `Validation Error: ${error.errors[0].message} ` },
      400
    );
  }

  let artificium = await prisma.artificium.findFirst({
    where: { projectId, userId, workspaceId },
  });
  if (!artificium) {
    artificium = await prisma.artificium.create({
      data: { projectId, userId, workspaceId },
    });
  }
  return c.json({
    message: 'artificium retrieved successfully',
    data: artificium,
  });
};

const getUserChatWithArtificium = async (c: Context) => {
  const q = c.req.query();
  if (!q['projectId'] && !q['userId']) {
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
        message.projectId === q['projectId'] &&
        message.userId === q['userId']
    )
    .reverse();
  const dbMessages = await prisma.artificiumChat.findMany({
    where: { projectId: q['projectId'], userId: q['userId'] },
  });

  const groupMessages = [...dbMessages, ...cacheMessages];

  return c.json({
    message: 'message retrieved successfully',
    data: groupMessages,
  });
};

const getUsersChat = async (c: Context) => {
  const param = c.req.query();
  if (!param['channelId']) {
    return c.json(
      {
        message: 'parameter channelId is required',
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
    .filter((message) => message.channelId === param['channelId'])
    .reverse();
  const dbMessages = await prisma.message.findMany({
    where: { channelId: param['channelId'] },
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
    if (!list_of_msg_to_update.length) {
      const updated_chat = await prisma.artificiumChat.update({
        where: { id: data.messageId },
        data: { text: data.text, timestamp: new Date(Date.now()) },
      });

      await prisma.artificiumChat.delete({
        where: { id: data.lastArtificiumResponseId },
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

    await redis.client.LSET(
      'new_message',
      indexToUpdateAt + 1,
      '__TO_DELETE__'
    );

    await redis.client.LREM('new_message', 1, '__TO_DELETE__');

    //  SEND THE updated message to Artificium

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
    message: `message with the id ${parsed_messages.id || JSON.parse(deleted).id
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
    message: `message with the id ${parsed_messages.id || JSON.parse(deleted).id
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
  const workspaceId = c.req.query('workspaceId');
  if (!ObjectId.isValid(workspaceId)) {
    return c.json({ message: 'invalid object id' }, 400);
  }

  const getWorkspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!getWorkspace) {
    return c.json({ message: 'workspace not found' }, 404);
  }
  const user = c.var.getUser();
  const userId = user.id;
  const body = await c.req.parseBody({ dot: true });
  const file = body['image'] as File;

  const max_size = 5 * 1024 * 1024;

  if (!file) {
    return c.json({ message: 'no file uploaded' }, 400);
  }

  if (file.size > max_size) {
    return c.json({ message: 'file size greater than 5 mb' }, 400);
  }

  const result = await cloudinary.api.resource(userId);
  if (result) {
    await cloudinary.uploader.destroy(
      userId,
      { resource_type: 'image' },
      (err, _) => {
        if (err) {
          return c.json(
            { message: 'an error occured while updating profile picture' },
            404
          );
        }
      }
    );
  }

  const imageBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  const workspace_result = await prisma.workspace.findUnique({
    where: { owner: user.id, id: workspaceId },
  });

  if (!workspace_result) {
    return c.json({ message: 'workspace not found' }, 404);
  }

  const uploadResult = (await cloudinary.uploader
    .upload(dataUri, {
      public_id: `${workspaceId}`,
      folder: 'workspacess',
    })
    .catch((error) => {
      console.log(error);
    })) as UploadApiResponse;

  const workspace = await prisma.workspace.update({
    where: { owner: user.id, id: workspaceId },
    data: { image: uploadResult.secure_url },
  });

  return c.json({ message: 'message uploaded successfully', data: workspace });
};

// test this code below !
const updateWorkspaceMemberRole = async (c: Context) => {
  const user = c.var.getUser()
  const req = await c.req.json()

  const { error, data } = makeAdminSchemaValidator(req)
  if (error) {
    return c.json({ message: `Validation Error: ${error.errors[0].message}` }, 400)
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: data.workspaceId } })
  if (workspace.owner !== user.id) {
    return c.json({ message: "Permission Denied, Not the workspace admin" }, 401)
  }

  const member = await prisma.workspaceMember.findUnique({ where: { id: data.workspaceMembershipId, workspaceId: workspace.id } })
  if (!member) {
    return c.json({ message: "workspace membership not found" }, 404)
  }
  await prisma.workspaceMember.update({ where: { id: data.workspaceMembershipId, workspaceId: workspace.id }, data: { role: data.role } })

  return c.json({ message: "member role updated successfully" })
}


const get_notification = async (c: Context) => {
  const userId = c.var.getUser().id

  const notifications = await prisma.notification.findMany({ where: { userId } })

  return c.json({ message: "notifications retrieved successfully", data: notifications })
}

// test this code below 
const updateProjectMembershipRole = async (c: Context) => {
  const userId = c.var.getUser().id
  const body = await c.req.json()
  const { error, data } = projectMemberRoleUpdateValidator(body)
  if (error) {
    return c.json({ message: error.errors[0].message }, 400)
  }
  const projectMember = await prisma.projectMember.findUnique({ where: { id: data.projectMembershipId } })
  if (!projectMember) {
    return c.json({ message: "projectMembership not found" }, 404)
  }
  const project = await prisma.project.findUnique({ where: { id: projectMember.projectId } })
  if (!project.creator == userId) {
    return c.json({ message: "Permission denied, can't modify member role" }, 401)
  }
  await prisma.projectMember.update({ where: { id: projectMember.id }, data: { role: data.role } })
  return c.json({ message: "membership role updated successfuly" })
}

// test this code below !

const MarkNotificationAsSeen = async (c: Context) => {
  const notificationId = c.req.param("notificationId")
  if (!ObjectId.isValid(notificationId)) {
    return c.json({ message: "invalid notification id", }, 400)
  }

  await prisma.notification.update({ where: { id: notificationId }, data: { status: true } })
  return c.json({ message: "seen notification" })
}



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
  acceptOrRevokeJoinChannelReq,
  leaveworkspace,
  uploadWorkspaceImage,
  getUserChatWithArtificium,
  getUsersChat,
  updateUserChatWithArtificium,
  updateUserChatInGroups,
  deleteChatWithArtificium,
  deleteUserChatInGroup,
  createThread,
  removeProjectMember,
  leaveProject,
  inviteWorkspaceMemberToProject,
  customEmitter,
  getLoggedInUserWorkspaceMembership,
  getProjectMembership,
  joinProject,
  invitationWithLink,
  getArtificium,
  redis,
  updateWorkspaceMemberRole,
  getChannelMembership,
  getChannelMembers,
  updateChannelMemberRole,
  get_notification,
  MarkNotificationAsSeen,
  updateProjectMembershipRole
};
