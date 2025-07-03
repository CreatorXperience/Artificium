import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { workspace } from '@org/database'

// Mocked workspace schema — update with your actual model fields

// Success joining response
const JoinSuccessResponse = z.object({
    message: z.string().openapi({ example: 'your are now a member of this workspace' }),
    data: workspace
})

// Already member response
const AlreadyMemberResponse = z.object({
    message: z.string().openapi({ example: 'user is already a member of this workspace' })
})

// Error response
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'workspace not found' })
})

// Create route
const joinWorkspaceRoute = createRoute({
    method: 'post',
    path: '/join',
    request: {
        query: z.object({
            workspaceId: z.string().openapi({ example: 'workspace-id-789' })
        })
    },
    responses: {
        200: {
            description: 'User successfully joined the workspace',
            content: {
                'application/json': {
                    schema: JoinSuccessResponse
                }
            }
        },
        201: {
            description: 'User is already a member',
            content: {
                'application/json': {
                    schema: AlreadyMemberResponse
                }
            }
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        },
        404: {
            description: 'Workspace not found',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        },
        500: {
            description: 'Server error while joining workspace',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        }
    }
})


export default joinWorkspaceRoute