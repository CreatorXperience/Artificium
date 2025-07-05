import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Request body schema
const InviteWorkspaceMemberRequest = z.object({
    projectId: z.string().openapi({
        description: 'ID of the project',
        example: '64e21f03b7f3a6d5f1e8a012',
    }),
    workspaceMembers: z
        .array(
            z.object({
                userId: z.string().openapi({
                    description: 'ID of the workspace user being invited',
                    example: '64e21f03b7f3a6d5f1e8a034',
                }),
            })
        )
        .optional()
        .openapi({
            description: 'List of workspace members to invite',
        }),
})

// Success response schema
const InviteWorkspaceMemberResponse = z.object({
    message: z.string().openapi({
        example: 'Operation completed successfully',
    }),
})

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Project not found',
    }),
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const inviteWorkspaceMemberToProjectRoute = createRoute({
    method: 'post',
    path: '/project/invite-workspace-members',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: InviteWorkspaceMemberRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Workspace members invited successfully',
            content: {
                'application/json': {
                    schema: InviteWorkspaceMemberResponse,
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
        404: {
            description: 'Project not found',
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

export default inviteWorkspaceMemberToProjectRoute
