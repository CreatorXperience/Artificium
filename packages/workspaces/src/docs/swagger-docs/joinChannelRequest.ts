import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const JoinChannelRequestBody = z.object({
    toAdmin: z.string().openapi({ example: 'admin-user-id' }),
    channelId: z.string().openapi({ example: 'channel-id-123' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-456' }),
    projectId: z.string().openapi({ example: 'project-id-789' }),
    projectMembershipId: z.string().openapi({ example: 'project-membership-id-101112' }),
    channelName: z.string().openapi({ example: 'General' }),
})

// Success response schema
const JoinChannelRequestSuccessResponse = z.object({
    message: z.string().openapi({ example: 'join request successfully sent' }),
    data: z.object({
        id: z.string(),
        name: z.string(),
        toAdmin: z.string(),
        userId: z.string(),
        channelId: z.string(),
        workspaceId: z.string(),
        projectId: z.string(),
        projectMembershipId: z.string(),
    }),
})

// Already requested response
const AlreadyRequestedResponse = z.object({
    message: z.string().openapi({ example: 'request sent' }),
    data: z.any(),
})

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'Validation Error: toAdmin is required' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const joinChannelRequestRoute = createRoute({
    method: 'post',
    path: '/channel/request',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: JoinChannelRequestBody,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Join channel request created or already exists',
            content: {
                'application/json': {
                    schema: JoinChannelRequestSuccessResponse,
                },
            },
        },
        201: {
            description: 'Join channel request already sent',
            content: {
                'application/json': {
                    schema: AlreadyRequestedResponse,
                },
            },
        },
        400: {
            description: 'Validation or bad request error',
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

export default joinChannelRequestRoute
