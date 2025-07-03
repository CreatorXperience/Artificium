import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// Mocked workspace member schema — update with your actual model fields
const WorkspaceMemberSchema = z.object({
    id: z.string().openapi({ example: 'member-id-123' }),
    userId: z.string().openapi({ example: 'user-id-456' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-789' }),
    role: z.string().openapi({ example: 'admin' }) // optional if your model includes role
})

// Success response schema
const SuccessResponse = z.object({
    message: z.string().openapi({ example: 'membership retrieved successfully' }),
    data: WorkspaceMemberSchema
})

// Error response schema
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'workspace not found' })
})

// Create route
const getLoggedInUserWorkspaceMembershipRoute = createRoute({
    method: 'get',
    path: '/workspace/:workspaceId/membership',
    request: {
        params: z.object({
            workspaceId: z.string().openapi({ example: 'workspace-id-789' })
        })
    },
    responses: {
        200: {
            description: 'Membership retrieved successfully',
            content: {
                'application/json': {
                    schema: SuccessResponse
                }
            }
        },
        404: {
            description: 'Workspace or membership not found',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        }
    }
})

export default getLoggedInUserWorkspaceMembershipRoute