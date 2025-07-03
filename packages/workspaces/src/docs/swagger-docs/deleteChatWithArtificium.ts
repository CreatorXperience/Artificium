import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const DeleteArtificiumMessagePayload = z.object({
    messageId: z.string().openapi({ example: 'msg-abc123' }),
    deleteForAll: z.boolean().openapi({ example: true }),
})

// Success response schema
const DeleteChatResponse = z.object({
    message: z.string().openapi({
        example: 'message with the id msg-abc123 successfully deleted.',
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

const deleteChatWithArtificiumRoute = createRoute({
    method: 'delete',
    path: '/chat/artificium',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: DeleteArtificiumMessagePayload,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Message deleted successfully (either for all or for self)',
            content: {
                'application/json': {
                    schema: DeleteChatResponse,
                },
            },
        },
        400: {
            description: 'Bad request due to validation error',
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

export default deleteChatWithArtificiumRoute
