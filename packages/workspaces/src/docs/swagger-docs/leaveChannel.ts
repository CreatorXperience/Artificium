import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request params schema
const LeaveChannelParams = z.object({
    channelId: z.string().openapi({ example: 'channel-id-123' }),
    projectMemberId: z.string().openapi({ example: 'project-member-id-456' }),
    channelMemberId: z.string().openapi({ example: 'channel-member-id-789' }),
})

// Success response
const LeaveChannelSuccessResponse = z.object({
    message: z.string().openapi({ example: 'leaved channel successfully' }),
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

const leaveChannelRoute = createRoute({
    method: 'delete',
    path: '/channel/leave/{channelId}/{projectMemberId}/{channelMemberId}',
    request: {
        params: LeaveChannelParams,
    },
    responses: {
        200: {
            description: 'User left channel successfully',
            content: {
                'application/json': {
                    schema: LeaveChannelSuccessResponse,
                },
            },
        },
        400: {
            description: 'Bad request / incomplete parameter',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        404: {
            description: 'Channel or member not found',
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

export default leaveChannelRoute
