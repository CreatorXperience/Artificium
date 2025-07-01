import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const LeaveProjectRequest = z.object({
    projectID: z.string().openapi({ example: 'project-id-123' }),
    workspaceMembershipId: z.string().openapi({ example: 'workspace-member-id-456' }),
    projectMembershipId: z.string().openapi({ example: 'project-member-id-789' }),
    username: z.string().openapi({ example: '@codeknight' })
})

// Success response
const LeaveProjectSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'John Doe has been removed from this project'
    })
})

// Error response
const LeaveProjectErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation Error: projectID is required'
    })
})

// -------------------------
// ROUTE
// -------------------------

const leaveProjectRoute = createRoute({
    method: 'delete',
    path: '/project/me/leave',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: LeaveProjectRequest
                }
            }
        }
    },
    responses: {
        200: {
            description: 'User successfully left the project',
            content: {
                'application/json': {
                    schema: LeaveProjectSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error or bad request',
            content: {
                'application/json': {
                    schema: LeaveProjectErrorResponse
                }
            }
        },
        404: {
            description: 'Project or workspace membership not found',
            content: {
                'application/json': {
                    schema: LeaveProjectErrorResponse
                }
            }
        },
        500: {
            description: 'Internal server error',
            content: {
                'application/json': {
                    schema: LeaveProjectErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default leaveProjectRoute
