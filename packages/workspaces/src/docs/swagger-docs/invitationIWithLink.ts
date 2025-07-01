import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const InvitationWithLinkRequest = z.object({
    projectId: z.string().openapi({ example: 'project-id-123' }),
    role: z.string().openapi({ example: 'member' })
})

// Success response
const InvitationWithLinkSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'you are now a member of this project'
    })
})

// Error response
const InvitationWithLinkErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation Error: projectId is required'
    })
})

// -------------------------
// ROUTE
// -------------------------

const invitationWithLinkRoute = createRoute({
    method: 'post',
    path: '/project/invitation',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: InvitationWithLinkRequest
                }
            }
        }
    },
    responses: {
        200: {
            description: 'User successfully joined the project via invitation link',
            content: {
                'application/json': {
                    schema: InvitationWithLinkSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error or invalid project id',
            content: {
                'application/json': {
                    schema: InvitationWithLinkErrorResponse
                }
            }
        },
        404: {
            description: 'Project not found',
            content: {
                'application/json': {
                    schema: InvitationWithLinkErrorResponse
                }
            }
        },
        500: {
            description: 'Server error while processing invitation',
            content: {
                'application/json': {
                    schema: InvitationWithLinkErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default invitationWithLinkRoute
