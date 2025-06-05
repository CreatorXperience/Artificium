import z, { SafeParseReturnType } from 'zod';
const project = z.object({
  name: z
    .string({ message: 'name is required' })
    .min(6, 'too short for a project name'),
  purpose: z.string({ message: 'purpose is required' }),
  workspaceId: z.string({ message: 'workspaceId is required' }),
  visibility: z.boolean({ message: 'property visibility is required' }),
  members: z.array(
    z.object({
      memberId: z.string({ message: 'memberId is required' }),
      name: z.string({ message: 'name is required' }),
      email: z.string({ message: 'email is required' }),
      image: z.string({ message: 'image is required' }),
      workspaceId: z.string({ message: 'workspaceId is required' }),
    }),
    { message: 'members is required' }
  ),
});
type TProject = Required<z.infer<typeof project>>;

const projectValidator = (payload: TProject) => {
  return project
    .required()
    .partial({ members: true })
    .safeParse(payload) as SafeParseReturnType<TProject, TProject>;
};

const projectUpdateValidator = (payload: Partial<TProject>) => {
  return project.partial().safeParse(payload);
};

const projectMember = z.object({
  projectId: z.string({ message: 'projectId is required' }),
  username: z.string({ message: 'property username is required' }),
  memberId: z.string({ message: 'property userId is required' }),
});

const projectMemberValidator = (
  payload: Required<z.infer<typeof projectMember>>
) => {
  return projectMember.safeParse(payload);
};

const projectRole = z.object({
  projectId: z.string({ message: 'property projectId is required' }),
  projectMemberRole: z.string({
    message: 'property projectMemberRole is required ',
  }),
  projectMembers: z.array(
    z.object({
      role: z.enum(['editor', 'viewer'], {
        message: 'property role must be one of the following: editor , viewer',
      }),
      membershipId: z.string({ message: 'property membershipId is required' }),
    })
  ),
  workspaceMembers: z.array(
    z.object({
      memberId: z.string({ message: 'memberId is required' }),
      name: z.string({ message: 'name is required' }),
      email: z.string({ message: 'email is required' }),
      image: z.string({ message: 'image is required' }),
      workspaceId: z.string({ message: 'workspaceId is required' }),
    }),
    { message: 'members is required' }
  ),
});

type TProjectRole = z.infer<typeof projectRole>;

const projectRoleValidator = (payload: TProjectRole) => {
  return projectRole.partial({ projectMembers: true }).safeParse(payload);
};

export {
  projectValidator,
  TProject,
  projectUpdateValidator,
  projectMemberValidator,
  projectRoleValidator,
};
