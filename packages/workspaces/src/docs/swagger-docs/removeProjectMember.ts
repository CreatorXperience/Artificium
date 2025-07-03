import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const RemoveProjectMemberRequest = z.object({
    projectID: z.string().openapi({ example: 'project-id-123' }),
    workspaceMembershipId: z.string().openapi({ example: 'workspace-member-id-456' }),
    projectMembershipId: z.string().openapi({ example: 'project-member-id-789' }),
    username: z.string().openapi({ example: 'Jane Doe' })
})

// Success response
const RemoveProjectMemberSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'Jane Doe has been removed from this project'
    })
})

// Error response
const RemoveProjectMemberErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation Error: projectID is required'
    })
})

// -------------------------
// ROUTE
// -------------------------

const removeProjectMemberRoute = createRoute({
    method: 'delete',
    path: '/project/member/remove',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: RemoveProjectMemberRequest
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Project member removed successfully',
            content: {
                'application/json': {
                    schema: RemoveProjectMemberSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error or bad request',
            content: {
                'application/json': {
                    schema: RemoveProjectMemberErrorResponse
                }
            }
        },
        401: {
            description: 'Permission denied',
            content: {
                'application/json': {
                    schema: RemoveProjectMemberErrorResponse
                }
            }
        },
        404: {
            description: 'Project or workspace membership not found',
            content: {
                'application/json': {
                    schema: RemoveProjectMemberErrorResponse
                }
            }
        },
        500: {
            description: 'Internal server error',
            content: {
                'application/json': {
                    schema: RemoveProjectMemberErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default removeProjectMemberRoute
