import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

const LeaveWorkspaceQuery = z.object({
    workspaceId: z.string().openapi({
        example: 'workspace-id-123',
        description: 'ID of the workspace the user wants to leave'
    }),
    userId: z.string().optional().openapi({
        example: 'user-id-456',
        description: 'Optional user ID; defaults to logged-in user'
    })
})

const LeaveSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'successfully removed user from workspace'
    })
})

const ErrorResponse = z.object({
    message: z.string().openapi({
        example: 'workspace not found'
    })
})

// -------------------------
// ROUTE
// -------------------------

const leaveWorkspaceRoute = createRoute({
    method: 'post',
    path: '/leave',
    request: {
        query: LeaveWorkspaceQuery
    },
    responses: {
        200: {
            description: 'User successfully left the workspace',
            content: {
                'application/json': {
                    schema: LeaveSuccessResponse
                }
            }
        },
        400: {
            description: 'Bad request (invalid or empty workspace ID)',
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
        }
    }
})

export default leaveWorkspaceRoute
