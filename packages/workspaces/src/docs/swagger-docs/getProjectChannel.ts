import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import channel from "../../../utils/channelZodSchema"
// Success response schema
const GetAllProjectChannelResponse = z.object({
    message: z.string().openapi({ example: 'channels retrieved successfully' }),
    data: z.array(channel).openapi('ChannelList'),
});

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'projectId is invalid' }),
});

// Route definition
const getAllProjectChannelRoute = createRoute({
    method: 'get',
    path: '/channel/:projectId',
    request: {
        params: z.object({
            projectId: z.string().openapi({ example: 'project-id-123' }),
        }),
    },
    responses: {
        200: {
            description: 'Channels retrieved successfully',
            content: {
                'application/json': {
                    schema: GetAllProjectChannelResponse,
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
    },
});


export default getAllProjectChannelRoute 
