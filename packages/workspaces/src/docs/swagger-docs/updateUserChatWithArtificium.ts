import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const UpdateArtificiumMessagePayload = z.object({
    messageId: z.string().openapi({ example: 'message-id-123' }),
    lastArtificiumResponseId: z.string().openapi({ example: 'message-id-456' }),
    text: z.string().min(1).openapi({ example: 'Updated message text' }),
})

// Success response schema
const UpdatedChatMessage = z.object({
    id: z.string().optional(),
    text: z.string(),
    timestamp: z.union([z.number(), z.string()]),  // Redis or DB might return either
})

// Response wrapper
const UpdateUserChatResponse = z.object({
    message: z.string().openapi({ example: 'message updated successfully' }),
    data: UpdatedChatMessage,
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'Validation Error: text is required' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const updateUserChatWithArtificiumRoute = createRoute({
    method: 'patch',
    path: '/chat/artificium',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: UpdateArtificiumMessagePayload,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Chat message updated successfully',
            content: {
                'application/json': {
                    schema: UpdateUserChatResponse,
                },
            },
        },
        400: {
            description: 'Bad request (validation error)',
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

export default updateUserChatWithArtificiumRoute
