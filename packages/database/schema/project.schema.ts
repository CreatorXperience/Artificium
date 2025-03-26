import z, { SafeParseReturnType } from 'zod';
const project = z.object({
  name: z
    .string({ message: 'name is required' })
    .min(6, 'too short for a project name'),
  purpose: z.string({ message: 'purpose is required' }),
  workspaceId: z.string({ message: 'workspaceId is required' }),
});

type TProject = Required<z.infer<typeof project>>;
const projectValidator = (payload: TProject) => {
  return project
    .required({ name: true, workspaceId: true })
    .partial({ purpose: true })
    .safeParse(payload) as SafeParseReturnType<TProject, TProject>;
};

const projectUpdateValidator = (payload: Partial<TProject>) => {
  return project.partial().safeParse(payload);
};

export { projectValidator, TProject, projectUpdateValidator };
