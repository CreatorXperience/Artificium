import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Path parameter schema
const MarkNotificationAsSeenParamSchema = z.object({
    notificationId: z.string().openapi({
        example: '64fc0e55dfcbe6c1f2a78f1a',
        description: 'The ID of the notification to mark as seen',
    }),
})

// Successful response schema
const MarkNotificationAsSeenResponseSchema = z.object({
    message: z.string().openapi({
        example: 'seen notification',
    }),
})

// Error response schema (for invalid ID)
const InvalidIdResponseSchema = z.object({
    message: z.string().openapi({
        example: 'invalid notification id',
    }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const markNotificationAsSeenRoute = createRoute({
    method: 'patch',
    path: '/notifications/{notificationId}/seen',
    request: {
        params: MarkNotificationAsSeenParamSchema,
    },
    responses: {
        200: {
            description: 'Notification marked as seen successfully',
            content: {
                'application/json': {
                    schema: MarkNotificationAsSeenResponseSchema,
                },
            },
        },
        400: {
            description: 'Invalid notification ID',
            content: {
                'application/json': {
                    schema: InvalidIdResponseSchema,
                },
            },
        },
    },
    security: [{ bearerAuth: [] }], // Assuming authenticated route
})

// -------------------------
// EXPORT
// -------------------------

export default markNotificationAsSeenRoute
