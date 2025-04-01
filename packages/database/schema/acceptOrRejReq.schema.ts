import z from 'zod';
const acceptOrRejectReq = z.object({
  signal: z.string({ message: 'property signal is required' }),
  channelId: z.string({ message: 'property channelId is required' }),
  userId: z.string({ message: 'property userId is required' }),
});

const acceptOrRejectReqValidator = (
  payload: z.infer<typeof acceptOrRejectReq>
) => {
  return acceptOrRejectReq.required().safeParse(payload);
};

export { acceptOrRejectReqValidator };
