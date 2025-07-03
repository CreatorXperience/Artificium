import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const UpdateChannelBody = z.object({
    name: z.string().optional().openapi({ example: 'Updated Channel Name' }),
    description: z.string().optional().openapi({ example: 'Updated description for the channel' }),
})

// Success response
const UpdateChannelSuccessResponse = z.object({
    message: z.string().openapi({ example: 'channel updated successfully' }),
    data: z.any().openapi({
        example: {
            id: 'channel-id-456',
            name: 'Updated Channel Name',
            description: 'Updated description for the channel',
        },
    }),
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'Validation Error: name is required' }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const updateChannelRoute = createRoute({
    method: 'patch',
    path: '/channel/{channelId}',
    request: {
        params: z.object({
            channelId: z.string().openapi({ example: 'channel-id-456' }),
        }),
        body: {
            content: {
                'application/json': {
                    schema: UpdateChannelBody,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Channel updated successfully',
            content: {
                'application/json': {
                    schema: UpdateChannelSuccessResponse,
                },
            },
        },
        400: {
            description: 'Validation or bad request',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        404: {
            description: 'Channel not found or invalid ID',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        500: {
            description: 'Server error',
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

export default updateChannelRoute
