import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Query params schema
const GetUsersChatQuery = z.object({
    channelId: z.string().openapi({
        description: 'Channel ID for which to retrieve messages',
        example: 'chan-abc123',
    }),
})

// Single message schema
const ChatMessage = z.object({
    id: z.string().optional().openapi({ example: 'msg-123' }),
    channelId: z.string().openapi({ example: 'chan-abc123' }),
    text: z.string().openapi({ example: 'Hello from cache' }),
    timestamp: z.number().openapi({ example: 1719824123000 }),
    user: z.string().optional().openapi({ example: 'HUMAN' }),
})

// Success response schema
const GetUsersChatResponse = z.object({
    message: z.string().openapi({
        example: 'message retrieved successfully',
    }),
    data: z.array(ChatMessage),
})

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({
        example: 'parameter channelId is required',
    }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const getUsersChatRoute = createRoute({
    method: 'get',
    path: '/chat/group',
    request: {
        query: GetUsersChatQuery,
    },
    responses: {
        200: {
            description: 'Messages retrieved successfully',
            content: {
                'application/json': {
                    schema: GetUsersChatResponse,
                },
            },
        },
        400: {
            description: 'Bad request due to missing or invalid query params',
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

export default getUsersChatRoute
