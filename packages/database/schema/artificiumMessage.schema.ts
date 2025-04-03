import z from 'zod';

const artificiumMessageSchema = z.object({
  projectId: z.string({ message: 'property projectId is required' }),
  channelId: z.string({ message: 'property channelId is required' }),
  userId: z.string({ message: 'property userId is required' }),
  text: z.string({ message: 'property text is required' }),
  user: z.string({ message: 'property user is required' }),
});

type TArtficiumMessage = Required<z.infer<typeof artificiumMessageSchema>>;
const artificiumMessagePayloadValidator = (payload: TArtficiumMessage) => {
  return artificiumMessageSchema.required().safeParse(payload);
};

export { artificiumMessagePayloadValidator };
