import z from 'zod';
const acceptOrRejectReq = z.object({
  signal: z.enum(['accept', 'reject'], {
    message: 'property signal is required',
  }),
  channelId: z.string({ message: 'property channelId is required' }),
  userId: z.string({ message: 'property userId is required' }),
});

const acceptOrRejectReqValidator = (
  payload: z.infer<typeof acceptOrRejectReq>
) => {
  return acceptOrRejectReq.required().safeParse(payload);
};



const acceptOrRejectSchema = z.object({
  userId: z.string({ message: "property userId is required" }),
  channelId: z.string({ message: "property channelId is required" }),
  signal: z.enum(["accept", "reject"], { message: "property signal is required" }),
  workspaceId: z.string({ message: "property workspaceId is required" }),
  projectId: z.string({ message: "property projectId is required" }),
  projectMembershipId: z.string({ message: "property projectMembershipId is required" }),
})

type TAcceptSchema = Required<z.infer<typeof acceptOrRejectSchema>>

const acceptOrRejectValidator = (payload: TAcceptSchema) => {
  return acceptOrRejectSchema.required().safeParse(payload)

}
export { acceptOrRejectReqValidator, acceptOrRejectValidator };
