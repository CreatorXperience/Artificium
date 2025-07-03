import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const AcceptOrRevokeJoinChannelBody = z.object({
    userId: z.string().openapi({ example: 'user-id-123' }),
    channelId: z.string().openapi({ example: 'channel-id-456' }),
    signal: z.enum(['accept', 'reject']).openapi({ example: 'accept' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-789' }),
    projectId: z.string().openapi({ example: 'project-id-101112' }),
    projectMembershipId: z.string().openapi({ example: 'project-membership-id-131415' }),
})

// Success response
const AcceptOrRevokeResponse = z.object({
    message: z.string().openapi({ example: 'Request to join channel has been accepted successfully' }),
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'Validation Error Some field is missing' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const acceptOrRevokeJoinChannelReqRoute = createRoute({
    method: 'post',
    path: '/channel/request/action',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: AcceptOrRevokeJoinChannelBody,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Request processed successfully',
            content: {
                'application/json': {
                    schema: AcceptOrRevokeResponse,
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
            description: 'Channel not found',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        500: {
            description: 'Server error',
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

export default acceptOrRevokeJoinChannelReqRoute
