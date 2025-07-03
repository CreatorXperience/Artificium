import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

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

// Path parameters
const GetChannelMembersParams = z.object({
    channelId: z.string().openapi({ example: 'channel-id-123' }),
})

// Success response
const GetChannelMembersSuccessResponse = z.object({
    message: z.string().openapi({ example: 'channel members retrieved sucessfully' }),
    data: z.array(channel).openapi({ example: [{ id: 'member-id-1' }, { id: 'member-id-2' }] })
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const getChannelMembersRoute = createRoute({
    method: 'get',
    path: '/channel/members/{channelId}',
    request: {
        params: GetChannelMembersParams,
    },
    responses: {
        200: {
            description: 'Channel members retrieved successfully',
            content: {
                'application/json': {
                    schema: GetChannelMembersSuccessResponse,
                },
            },
        },
    },
})

// -------------------------
// EXPORT
// -------------------------

export default getChannelMembersRoute
