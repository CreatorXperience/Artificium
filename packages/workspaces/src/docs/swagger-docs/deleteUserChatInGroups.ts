import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const DeleteChatMessageRequest = z.object({
    messageId: z.string().openapi({ description: 'ID of the message to delete', example: 'msg-123' }),
    deleteForAll: z.boolean().openapi({
        description: 'Whether to delete the message for all members or just the current user',
        example: true,
    }),
})

// Success response schema
const DeleteChatMessageResponse = z.object({
    message: z.string().openapi({
        example: 'message with the id msg-123 successfully deleted.',
    }),
})

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation Error: messageId is required',
    }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const deleteUserChatInGroupRoute = createRoute({
    method: 'delete',
    path: '/chat/group',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: DeleteChatMessageRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Message deleted successfully',
            content: {
                'application/json': {
                    schema: DeleteChatMessageResponse,
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
    },
})

// -------------------------
// EXPORT
// -------------------------

export default deleteUserChatInGroupRoute
