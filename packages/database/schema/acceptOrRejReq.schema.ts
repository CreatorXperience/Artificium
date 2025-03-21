import z from 'zod';
const acceptOrRejectReq = z.object({
  signal: z.string(),
  channelId: z.string(),
  userId: z.string(),
});

const acceptOrRejectReqValidator = (
  payload: z.infer<typeof acceptOrRejectReq>
) => {
  return acceptOrRejectReq.required().safeParse(payload);
};

export { acceptOrRejectReqValidator };
