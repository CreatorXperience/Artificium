import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request params schema
const JoinChannelParams = z.object({
    channelId: z.string().openapi({ example: 'channel-id-123' }),
    projectMemberId: z.string().openapi({ example: 'project-member-id-456' }),
})

// Success response
const JoinChannelSuccessResponse = z.object({
    message: z.string().openapi({ example: 'joined channel successfully' }),
    data: z.object({
        id: z.string(),
        name: z.string().optional(),
        members: z.array(z.string()),
    }),
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'channel not found' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const joinChannelRoute = createRoute({
    method: 'post',
    path: '/channel/join/{channelId}/{projectMemberId}',
    request: {
        params: JoinChannelParams,
    },
    responses: {
        200: {
            description: 'User joined channel successfully',
            content: {
                'application/json': {
                    schema: JoinChannelSuccessResponse,
                },
            },
        },
        400: {
            description: 'Bad request / validation error',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        404: {
            description: 'Channel or project membership not found',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        500: {
            description: 'Internal server error',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
    },
})

// -------------------------
// EXPORT
// -------------------------

export default joinChannelRoute
