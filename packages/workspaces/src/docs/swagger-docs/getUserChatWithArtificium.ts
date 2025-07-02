import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request query schema
const GetUserChatQuery = z.object({
    projectId: z.string().openapi({ example: 'project-id-123' }),
    userId: z.string().openapi({ example: 'user-id-456' }),
})

// Chat message structure (simplified)
const ChatMessage = z.object({
    projectId: z.string(),
    userId: z.string().optional(), // may not exist in cached messages depending on structure
    text: z.string(),
    timestamp: z.number(),
    user: z.string(),
})

// Success response
const GetUserChatResponse = z.object({
    message: z.string().openapi({ example: 'message retrieved successfully' }),
    data: z.array(ChatMessage),
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: "parameter 'projectId' and 'userId' are required" }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const getUserChatWithArtificiumRoute = createRoute({
    method: 'get',
    path: '/chat/artificium',
    request: {
        query: GetUserChatQuery,
    },
    responses: {
        200: {
            description: 'Chat messages retrieved successfully',
            content: {
                'application/json': {
                    schema: GetUserChatResponse,
                },
            },
        },
        400: {
            description: 'Bad request / missing parameters',
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

export default getUserChatWithArtificiumRoute
