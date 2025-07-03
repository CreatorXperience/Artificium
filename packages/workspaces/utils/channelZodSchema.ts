import z from "zod"

const channel = z.object({
    id: z.string(),
    projectId: z.string(),
    workspaceId: z.string(),
    visibility: z.boolean().default(false),
    name: z.string(),
    stars: z.number().int().default(0),
    members: z.array(z.string()),
    admin: z.string(),
});

export default channel