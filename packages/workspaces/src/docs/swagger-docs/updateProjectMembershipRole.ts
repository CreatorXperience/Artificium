import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const UpdateProjectMembershipRoleRequest = z.object({
    projectMembershipId: z.string().openapi({
        description: 'ID of the project membership to update',
        example: '64e21f03b7f3a6d5f1e8a078',
    }),
    role: z.enum(['admin', 'editor', 'viewer']).openapi({
        description: 'New role for the project membership',
        example: 'editor',
    }),
})

// Success response schema
const UpdateProjectMembershipRoleResponse = z.object({
    message: z.string().openapi({
        example: 'membership role updated successfuly',
    }),
})

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Permission denied, can\'t modify member role',
    }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const updateProjectMembershipRoleRoute = createRoute({
    method: 'put',
    path: '/project/member/role',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: UpdateProjectMembershipRoleRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Membership role updated successfully',
            content: {
                'application/json': {
                    schema: UpdateProjectMembershipRoleResponse,
                },
            },
        },
        400: {
            description: 'Validation or input error',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        401: {
            description: 'Permission denied',
            content: {
                'application/json': {
                    schema: ErrorResponse,
                },
            },
        },
        404: {
            description: 'Project membership not found',
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

export default updateProjectMembershipRoleRoute
