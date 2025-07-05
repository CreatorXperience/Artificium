import z, { SafeParseReturnType } from 'zod';
const project = z.object({
  name: z
    .string({ message: 'name is required' })
    .min(6, 'too short for a project name'),
  purpose: z.string({ message: 'purpose is required' }),
  workspaceId: z.string({ message: 'workspaceId is required' }).length(24, {
    message: 'property workspaceId must be exactly 24 in length',
  }),
  visibility: z.boolean({ message: 'property visibility must be a boolean' }),
  members: z.array(
    z.object({
      memberId: z.string({ message: 'memberId is required' }).length(24, {
        message: 'property memberId must be exactly 24 in length',
      }),
      name: z.string({ message: 'name is required' }),
      email: z.string({ message: 'email is required' }),
      image: z.string({ message: 'image is required' }).url({ message: "not a valid url" }),
      workspaceId: z.string({ message: 'workspaceId is required' }),
      userId: z.string({ message: 'userId is required' }).length(24, {
        message: 'property userId must be exactly 24 in length',
      }),
    }),
    { message: 'property members must be a list' }
  ),
});
type TProject = Required<z.infer<typeof project>>;

const projectValidator = (payload: TProject) => {
  return project
    .required()
    .partial({ visibility: true, purpose: true })
    .safeParse(payload) as SafeParseReturnType<TProject, TProject>;
};

const projectUpdateValidator = (
  payload: Omit<Partial<TProject>, 'members'>
) => {
  return project
    .partial()
    .omit({ members: true })
    .safeParse(payload) as z.SafeParseReturnType<
      Omit<TProject, 'members'>,
      Omit<TProject, 'members'>
    >;
};

const projectMember = z.object({
  projectID: z
    .string({ message: 'property projectID is required' })
    .length(24, {
      message: 'property projectID must be exactly 24 in length',
    }),
  projectMembershipId: z
    .string({ message: 'property projectMembershipId is required' })
    .length(24, {
      message: 'property projectMembershipId must be exactly 24 in length',
    }),
  workspaceMembershipId: z
    .string({ message: 'property workspaceMembershipId is required' })
    .length(24, {
      message: 'property workspaceMembershipId must be exactly 24 in length',
    }),

  username: z.string({ message: 'property username is required' }),
});

const projectMemberValidator = (
  payload: Required<z.infer<typeof projectMember>>
) => {
  return projectMember.partial({ username: true }).safeParse(payload);
};

const projectRole = z.object({
  projectId: z
    .string({ message: 'property projectId is required' })
    .length(24, {
      message: 'property projectId must be exactly 12 in length',
    }),
  workspaceMembers: z.array(
    z.object({
      memberId: z
        .string({ message: 'property memberId is required' })
        .length(24, {
          message: 'property memberId must be exactly 12 in length',
        }),
      userId: z.string({ message: 'property userId is required' }).length(24, {
        message: 'property userId must be exactly 12 in length',
      }),
    }),
    { message: 'members is required' }
  ),
});

type TProjectRole = z.infer<typeof projectRole>;

const projectRoleValidator = (payload: TProjectRole) => {
  return projectRole
    .required()
    .safeParse(payload);
};

const projectMemberRoleUpdate = z.object({
  role: z.enum(['editor', 'viewer'], {
    message: 'property role must be one of the following: editor , viewer',
  }),
  projectMembershipId: z
    .string({
      message: 'property membershipId is required',
    })
    .length(24, {
      message: 'property projectMembershipId must be exactly 12 in length',
    }),
})

const projectMemberRoleUpdateValidator = (payload: Required<z.infer<typeof projectMemberRoleUpdate>>) => {
  return projectMemberRoleUpdate.required().safeParse(payload)
}
export {
  projectValidator,
  TProject,
  projectUpdateValidator,
  projectMemberValidator,
  projectRoleValidator,
  projectMemberRoleUpdateValidator,
  project
};
