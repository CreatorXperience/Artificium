import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Query parameters
const GetChannelMembershipQuery = z.object({
    userId: z.string().openapi({ example: 'user-id-123' }),
    channelId: z.string().openapi({ example: 'channel-id-456' }),
    projectId: z.string().openapi({ example: 'project-id-789' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-321' }),
})

// Success response
const ChannelMembershipSuccessResponse = z.object({
    message: z.string().openapi({ example: 'channel membership retrieved successfully' }),
})

// Not found response
const ChannelMembershipNotFoundResponse = z.object({
    message: z.string().openapi({ example: 'channel member not found' }),
})

// Validation error response
const ChannelMembershipValidationErrorResponse = z.object({
    message: z.string().openapi({ example: 'Invalid query Params' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const getChannelMembershipRoute = createRoute({
    method: 'get',
    path: '/channel/membership',
    request: {
        query: GetChannelMembershipQuery,
    },
    responses: {
        200: {
            description: 'Channel membership found',
            content: {
                'application/json': {
                    schema: ChannelMembershipSuccessResponse,
                },
            },
        },
        404: {
            description: 'Channel membership not found',
            content: {
                'application/json': {
                    schema: ChannelMembershipNotFoundResponse,
                },
            },
        },
        400: {
            description: 'Invalid query params',
            content: {
                'application/json': {
                    schema: ChannelMembershipValidationErrorResponse,
                },
            },
        },
    },
})



export default getChannelMembershipRoute
