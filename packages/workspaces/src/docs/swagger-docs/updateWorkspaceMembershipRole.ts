import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

const UpdateWorkspaceMemberRoleBody = z.object({
    workspaceId: z.string().openapi({
        example: 'workspace-id-123',
        description: 'ID of the workspace'
    }),
    workspaceMembershipId: z.string().openapi({
        example: 'member-id-456',
        description: 'ID of the workspace member'
    }),
    role: z.string().openapi({
        example: 'admin',
        description: 'The new role to assign to the member'
    })
})

const UpdateSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'member role updated successfully'
    })
})

const ValidationErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation Error: workspaceId is required'
    })
})

const PermissionDeniedResponse = z.object({
    message: z.string().openapi({
        example: 'Permission Denied, Not the workspace admin'
    })
})

const MembershipNotFoundResponse = z.object({
    message: z.string().openapi({
        example: 'workspace membership not found'
    })
})

// -------------------------
// ROUTE
// -------------------------

const updateWorkspaceMemberRoleRoute = createRoute({
    method: 'post',
    path: '/member/update-role',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: UpdateWorkspaceMemberRoleBody
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Member role updated successfully',
            content: {
                'application/json': {
                    schema: UpdateSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: ValidationErrorResponse
                }
            }
        },
        401: {
            description: 'Permission denied',
            content: {
                'application/json': {
                    schema: PermissionDeniedResponse
                }
            }
        },
        404: {
            description: 'Membership not found',
            content: {
                'application/json': {
                    schema: MembershipNotFoundResponse
                }
            }
        }
    }
})

export default updateWorkspaceMemberRoleRoute
