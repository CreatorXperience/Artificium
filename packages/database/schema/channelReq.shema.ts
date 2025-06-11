import z from 'zod';
// id      String  @id @default(auto()) @map("_id") @db.ObjectId
// name    String
// userId  String  @unique
// toAdmin String  @unique
// accept  Boolean
const channelReq = z.object({
  channelId: z.string({ message: 'property channelId is required' }),
  channelName: z.string({ message: 'property channelName is required' }),
  toAdmin: z.string({ message: 'property toAdmin is required' }),
  accept: z.boolean(),
  revoke: z.boolean(),
  projectId: z.string({ message: 'property projectId is required' }),
  workspaceId: z.string({ message: 'property workspaceId is required' }),
  projectMembershipId: z.string({
    message: 'property projectMembershipId is required',
  }),
});

type TChannelReq = z.infer<typeof channelReq>;
const channelReqValidator = (payload: TChannelReq) => {
  return channelReq.partial({ accept: true, revoke: true }).safeParse(payload);
};

export { TChannelReq, channelReqValidator };
