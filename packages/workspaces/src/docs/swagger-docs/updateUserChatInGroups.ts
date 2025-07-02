import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const UpdateChatMessageRequest = z.object({
    messageId: z.string().openapi({ description: 'ID of the message to update', example: 'msg-123' }),
    text: z.string().openapi({ description: 'Updated text content', example: 'Updated message text' }),
})

// Chat message response schema
const UpdatedChatMessage = z.object({
    id: z.string().optional().openapi({ example: 'msg-123' }),
    text: z.string().openapi({ example: 'Updated message text' }),
    timestamp: z.string().datetime().openapi({ example: '2025-07-01T12:00:00Z' }),
    channelId: z.string().optional().openapi({ example: 'chan-abc123' }),
    user: z.string().optional().openapi({ example: 'HUMAN' }),
})

// Success response schema
const UpdateChatMessageResponse = z.object({
    message: z.string().openapi({ example: 'message updated successfully' }),
    data: UpdatedChatMessage,
})

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'Validation Error: messageId is required' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const updateUserChatInGroupsRoute = createRoute({
    method: 'patch',
    path: '/chat/group',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: UpdateChatMessageRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Message updated successfully',
            content: {
                'application/json': {
                    schema: UpdateChatMessageResponse,
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
    },
})

// -------------------------
// EXPORT
// -------------------------

export default updateUserChatInGroupsRoute
