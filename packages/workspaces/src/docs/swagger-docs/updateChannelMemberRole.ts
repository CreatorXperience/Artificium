import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request query schema
const UpdateChannelMemberRoleQuery = z.object({
    channelId: z.string().openapi({ example: 'channel-id-123' }),
    channelMembershipId: z.string().openapi({ example: 'channel-membership-id-456' }),
    role: z.enum(['admin', 'editor', 'viewer']).openapi({ example: 'editor' }),
})

// Success response
const UpdateChannelMemberRoleSuccessResponse = z.object({
    message: z.string().openapi({ example: 'channel member role updated successfully' }),
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'Permission denied, not an admin' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const updateChannelMemberRoleRoute = createRoute({
    method: 'patch',
    path: '/channel/member/role',
    request: {
        query: UpdateChannelMemberRoleQuery
    },
    responses: {
        200: {
            description: 'Channel member role updated successfully',
            content: {
                'application/json': {
                    schema: UpdateChannelMemberRoleSuccessResponse,
                },
            },
        },
        400: {
            description: 'Invalid query or bad request',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        401: {
            description: 'Permission denied',
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

export default updateChannelMemberRoleRoute
