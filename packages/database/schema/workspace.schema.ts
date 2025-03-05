import z from 'zod';

// id             String   @id @default(auto()) @map("_id") @db.ObjectId
// url            String?  @unique @default("")
// visibility     Boolean  @default(false)
// readAccess     Json?
// writeAccess    Json?
// totalMembers   Int
// name           String
// description    String?  @default("")
// RandR          String?  @default("")
// image          String?  @default("https://i.pinimg.com/736x/4e/38/e7/4e38e73208c8a9c2410e4f1d9cb90ee5.jpg")
// workspaceAdmin Json
// members        String[]
// owner          String   @db.ObjectId
// plan           String?  @default("free")
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
  image: z.string(),
  workspaceAdmin: z.array(z.string()),
  members: z.array(z.string()),
  plan: z.string(),
});

const access = z.object({
  read: z.boolean(),
  write: z.boolean(),
  userId: z.string(),
});

type TWorkspace = Required<z.infer<typeof workspace>>;

type TCreateWorkspace = Required<z.infer<typeof createWorkspace>>;

const workspaceValidator = (payload: z.infer<typeof createWorkspace>) => {
  return createWorkspace.safeParse(payload);
};
const updateWorkspaceValidator = (payload: z.infer<typeof workspace>) => {
  const workspaceSchema = workspace.partial();
  return workspaceSchema.safeParse(payload);
};

export {
  workspaceValidator,
  TCreateWorkspace,
  updateWorkspaceValidator,
  TWorkspace,
};
