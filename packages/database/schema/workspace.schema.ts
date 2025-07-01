import z, { SafeParseReturnType } from 'zod';

const createWorkspace = z.object({
  visibility: z.boolean().optional().default(false),
  name: z
    .string({ message: ' property name must be a string' })
    .min(8, { message: "property name can't a value less than 8 " }),
  description: z
    .string({ message: 'property description must be a string' })
    .optional(),
});

const workspace = z.object({
  url: z.string(),
  visibility: z.boolean(),
  readAccess: z.array(z.string()),
  writeAccess: z.array(z.string()),
  totalMembers: z.number(),
  name: z.string(),
  description: z.string(),
  randr: z.string(),
  image: z.string().url({ message: "not a valid url" }),
  workspaceAdmin: z.array(z.string()),
  members: z.array(z.string()),
  plan: z.string(),
});

type TWorkspace = Required<z.infer<typeof workspace>>;

type TCreateWorkspace = z.infer<typeof createWorkspace>;

const workspaceValidator = (
  payload: TCreateWorkspace
): SafeParseReturnType<TCreateWorkspace, TCreateWorkspace> => {
  return createWorkspace.required({ name: true }).safeParse(payload);
};
const updateWorkspaceValidator = (payload: TWorkspace) => {
  return workspace.partial().safeParse(payload);
};


const makeAdminSchema = z.object({
  workspaceId: z.string({ message: "property workspaceId is required" }),
  workspaceMembershipId: z.string({ message: "property workspaceMembershipId is required" }),
  role: z.enum(["admin", "viewer", 'editor'])
})

type TMakeAdminSchemaPayload = Required<z.infer<typeof makeAdminSchema>>
const makeAdminSchemaValidator = (payload: TMakeAdminSchemaPayload) => {
  return makeAdminSchema.required().safeParse(payload)
}
export {
  workspaceValidator,
  TCreateWorkspace,
  updateWorkspaceValidator,
  TWorkspace,
  makeAdminSchemaValidator, workspace
};
