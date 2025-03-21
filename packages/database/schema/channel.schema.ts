import z, { SafeParseReturnType } from 'zod';

const channel = z.object({
  name: z.string({ message: 'name is required' }).min(6, 'name is too short'),
  visibility: z.boolean(),
  projectId: z.string(),
  workspaceId: z.string(),
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
  return channel.partial().safeParse(payload);
};
export { TChannel, channelValidator, channelUpdateValidator };
