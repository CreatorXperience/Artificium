import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { workspace } from '@org/database' // Replace this with your actual workspace model

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Path param for workspace ID
const UpdateWorkspacePath = z.object({
    id: z.string().openapi({
        example: 'workspace-id-123',
        description: 'ID of the workspace to update'
    })
})

// Body schema (replace fields with your actual update schema)
const UpdateWorkspaceBody = z.object({
    name: z.string().min(1).optional().openapi({
        example: 'New Workspace Name'
    }),
    description: z.string().optional().openapi({
        example: 'Updated description for the workspace'
    })
    // Add more fields as appropriate
})

// Success response
const UpdateWorkspaceSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'workspace workspace-id-123 updated successfully'
    }),
    data: workspace
})

// Error response
const UpdateWorkspaceErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation Error: Name is required'
    })
})

// -------------------------
// ROUTE
// -------------------------

const updateWorkspaceRoute = createRoute({
    method: 'patch',
    path: '/{id}',
    request: {
        params: UpdateWorkspacePath,
        body: {
            content: {
                'application/json': {
                    schema: UpdateWorkspaceBody
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Workspace updated successfully',
            content: {
                'application/json': {
                    schema: UpdateWorkspaceSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: UpdateWorkspaceErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default updateWorkspaceRoute
