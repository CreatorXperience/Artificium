import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import channel from "../../../utils/channelZodSchema"

// -------------------------
// ZOD SCHEMAS
// -------------------------


// Channel member input schema
const ChannelMemberInput = z.object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    image: z.string().url().openapi({ example: 'https://example.com/avatar.png' }),
    memberId: z.string().openapi({ example: 'member-id-123' }),
    name: z.string().openapi({ example: 'John Doe' }),
    userId: z.string().openapi({ example: 'user-id-456' }),
    projectId: z.string().openapi({ example: 'project-id-789' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-321' }),
})

// Request body schema
const CreateChannelBody = z.object({
    name: z.string().openapi({ example: 'General' }),
    description: z.string().optional().openapi({ example: 'A general discussion channel' }),
    projectId: z.string().openapi({ example: 'project-id-789' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-321' }),
    members: z.array(ChannelMemberInput).optional(),
})

// Success response
const CreateChannelSuccessResponse = z.object({
    message: z.string().openapi({ example: 'Channel created successfully' }),
    data: channel.openapi({
        example: {
            id: 'channel-id-456',
            name: 'General',
            admin: 'user-id-123',
            members: ['member-id-1', 'member-id-2'],
            stars: 5,
            projectId: "project-id-123",
            visibility: true,
            workspaceId: "workspace-id-123"
        },
    }),
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'Invalid Id(s)' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const createChannelRoute = createRoute({
    method: 'post',
    path: '/channel',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateChannelBody,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Channel created successfully',
            content: {
                'application/json': {
                    schema: CreateChannelSuccessResponse,
                },
            },
        },
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        404: {
            description: 'Invalid or bad ID',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        500: {
            description: 'Internal Server Error',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
    },
})



export default createChannelRoute
