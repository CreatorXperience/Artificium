import z from 'zod';

const artificiumMessageSchema = z.object({
  projectId: z.string({ message: 'property projectId is required' }),
  userId: z.string({ message: 'property userId is required' }),
  text: z.string({ message: 'property text is required' }),
  user: z.string({ message: 'property user is required' }),
});

const artificiumMessageUpdateSchema = z.object({
  text: z.string({ message: 'property text is required' }),
  messageId: z.string({ message: 'property text is required' }),
});

type TArtficiumMessage = Required<z.infer<typeof artificiumMessageSchema>>;
const artificiumMessagePayloadValidator = (payload: TArtficiumMessage) => {
  return artificiumMessageSchema.required().safeParse(payload);
};

const updateArtificiumMessagePayloadSchema = (payload: TArtficiumMessage) => {
  return artificiumMessageUpdateSchema.required().safeParse(payload);
};

export {
  artificiumMessagePayloadValidator,
  updateArtificiumMessagePayloadSchema,
};
