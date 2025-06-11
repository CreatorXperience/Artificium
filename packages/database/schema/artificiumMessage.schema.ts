import z from 'zod';

const artificiumMessageSchema = z.object({
  projectId: z.string({ message: 'property projectId is required' }),
  userId: z.string({ message: 'property userId is required' }),
  text: z.string({ message: 'property text is required' }),
  user: z.string({ message: 'property user is required' }),
  threadId: z.string({ message: 'property threadID is required' }),
  workspaceId: z.string({ message: 'property workspaceId is required' }),
  artificiumId: z.string({ message: 'property artificiumId is required' }),
  channelId: z.string({ message: 'property channelId is required' }),
});

const artificiumMessageUpdateSchema = z.object({
  text: z.string({ message: 'property text is required' }),
  messageId: z.string({ message: 'property text is required' }),
  lastArtificiumResponseId: z.string({
    message: 'property lastArtificiumResponseId is required',
  }),
});

const artificiumMessageDeleteSchema = z.object({
  messageId: z.string({ message: 'property messageId is required' }),
  deleteForAll: z.boolean({
    message: 'property deleteForAll must be a string',
  }),
});

const artficiumSchema = z.object({
  projectId: z.string({ message: 'property projectId is required' }),
  userId: z.string({ message: 'property userId is required' }),
  workspaceId: z.string({ message: 'property workspaceId is required' }),
});

type TArtificium = z.infer<typeof artficiumSchema>;

const artificiumValidator = (payload: TArtificium) => {
  return artficiumSchema.required().safeParse(payload);
};

type TArtficiumMessage = Required<z.infer<typeof artificiumMessageSchema>>;
const artificiumMessagePayloadValidator = (payload: TArtficiumMessage) => {
  return artificiumMessageSchema.required().safeParse(payload);
};

const updateArtificiumMessagePayloadSchema = (payload: TArtficiumMessage) => {
  return artificiumMessageUpdateSchema.required().safeParse(payload);
};

type TDeleteMessageSchema = z.infer<typeof artificiumMessageDeleteSchema>;
const deleteArtificiumMessageValidator = (payload: TDeleteMessageSchema) => {
  return artificiumMessageDeleteSchema
    .required()
    .or(
      z
        .object({
          messageId: z.string({ message: 'property messageId is required' }),
          deleteForMe: z.boolean({
            message: 'property deleteForMe must be a string',
          }),
        })
        .required()
    )
    .safeParse(payload);
};

export {
  artificiumMessagePayloadValidator,
  updateArtificiumMessagePayloadSchema,
  deleteArtificiumMessageValidator,
  artificiumValidator,
};
