import z from 'zod';
// id      String  @id @default(auto()) @map("_id") @db.ObjectId
// name    String
// userId  String  @unique
// toAdmin String  @unique
// accept  Boolean
const channelReq = z.object({
  channelId: z.string(),
  channelName: z.string(),
  toAdmin: z.string(),
  accept: z.boolean(),
  revoke: z.boolean(),
  projectId: z.string(),
  workspaceId: z.string(),
  projectMembershipId: z.string(),
});

type TChannelReq = z.infer<typeof channelReq>;
const channelReqValidator = (payload: TChannelReq) => {
  return channelReq.partial({ accept: true, revoke: true }).safeParse(payload);
};

export { TChannelReq, channelReqValidator };
