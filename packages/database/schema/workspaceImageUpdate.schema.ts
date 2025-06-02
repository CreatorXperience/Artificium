import z from 'zod';
const workspaceImageUpdateSchema = z.object({
  workspaceId: z.string({ message: 'property owner is required' }),
});

type imageUpdateSchema = Required<z.infer<typeof workspaceImageUpdateSchema>>;
const validateWorkspaceImageUpdate = (payload: imageUpdateSchema) => {
  return workspaceImageUpdateSchema.safeParse(payload);
};

export default validateWorkspaceImageUpdate;
