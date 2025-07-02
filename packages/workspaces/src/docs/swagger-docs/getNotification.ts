import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// A single notification object shape
const NotificationSchema = z.object({
    id: z.string().openapi({ example: 'notif_abc123' }),
    userId: z.string().openapi({ example: 'user_xyz789' }),
    text: z.string().openapi({ example: 'You have a new message' }),
    link: z.string().nullable().openapi({ example: '/messages/123' }),
    createdAt: z.string().openapi({
        description: 'ISO 8601 timestamp',
        example: '2025-07-01T12:00:00.000Z',
    }),
    // Add any other fields from your Prisma notification model as needed
})

// Successful response schema
const GetNotificationResponse = z.object({
    message: z.string().openapi({
        example: 'notifications retrieved successfully',
    }),
    data: z.array(NotificationSchema),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const getNotificationRoute = createRoute({
    method: 'get',
    path: '/notifications',
    security: [{ bearerAuth: [] }], // Assuming auth is required
    responses: {
        200: {
            description: 'List of notifications retrieved successfully',
            content: {
                'application/json': {
                    schema: GetNotificationResponse,
                },
            },
        },
    },
})

// -------------------------
// EXPORT
// -------------------------

export default getNotificationRoute
