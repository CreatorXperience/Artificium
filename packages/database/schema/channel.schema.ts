import z, { SafeParseReturnType } from 'zod';

const channel = z.object({
  name: z.string({ message: 'name is required' }).min(6, 'name is too short'),
  visibility: z.boolean(),
  projectId: z.string(),
  workspaceId: z.string(),
  members: z.array(
    z.object({
      memberId: z.string({ message: 'memberId is required' }).length(24, {
        message: 'property memberId must be exactly 24 in length',
      }),
      name: z.string({ message: 'name is required' }),
      email: z.string({ message: 'email is required' }),
      image: z.string({ message: 'image is required' }),
      workspaceId: z
        .string({ message: 'property workspaceId is required' })
        .length(24, {
          message: 'property workspaceId must be exactly 24 in length',
        }),
      projectId: z
        .string({ message: 'property projectId is required' })
        .length(24, {
          message: 'property projectId must be exactly 24 in length',
        }),
      userId: z.string({ message: 'property userId is required' }).length(24, {
        message: 'property userId must be exactly 24 in length',
      }),
    }),
    { message: 'property members must be a list' }
  ),
});

type TChannel = z.infer<typeof channel>;

const channelValidator = (payload: TChannel) => {
  return channel
    .partial({ visibility: true })
    .safeParse(payload) as SafeParseReturnType<
    Required<TChannel>,
    Required<TChannel>
  >;
};

const channelUpdateValidator = (payload: TChannel) => {
  return channel
    .partial()
    .omit({ members: true })
    .safeParse(payload) as z.SafeParseReturnType<
    Omit<TChannel, 'members'>,
    Omit<TChannel, 'members'>
  >;
};
export { TChannel, channelValidator, channelUpdateValidator };
