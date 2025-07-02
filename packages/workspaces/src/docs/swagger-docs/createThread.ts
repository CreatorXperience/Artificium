import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Success response schema
const CreateThreadResponse = z.object({
    data: z.object({
        threadID: z.string().openapi({
            description: 'The unique ID of the created thread',
            example: 'thread_abc123',
        }),
        timestamp: z.string().openapi({
            description: 'Timestamp of thread creation (ISO 8601)',
            example: '2025-07-01T12:00:00.000Z',
        }),
        message: z.string().openapi({
            description: 'Confirmation message',
            example: 'Thread created successfully',
        }),
    }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const createThreadRoute = createRoute({
    method: 'post',
    path: '/chat/thread',
    responses: {
        200: {
            description: 'Thread successfully created',
            content: {
                'application/json': {
                    schema: CreateThreadResponse,
                },
            },
        },
    },
})

// -------------------------
// EXPORT
// -------------------------

export default createThreadRoute
