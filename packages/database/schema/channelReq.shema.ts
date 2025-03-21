import z from 'zod';
// id      String  @id @default(auto()) @map("_id") @db.ObjectId
// name    String
// userId  String  @unique
// toAdmin String  @unique
// accept  Boolean
const channelReq = z.object({
  name: z.string(),
  channelId: z.string(),
  toAdmin: z.string(),
  accept: z.boolean(),
  revoke: z.boolean(),
});

type TChannelReq = z.infer<typeof channelReq>;
const channelReqValidator = (payload: TChannelReq) => {
  return channelReq.partial({ accept: true, revoke: true }).safeParse(payload);
};

export { TChannelReq, channelReqValidator };
