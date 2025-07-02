import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { project } from '@org/database' // Adjust this import to your actual project model type

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Params schema
const GetAllWorkspaceProjectsParams = z.object({
    workspaceId: z.string().openapi({ example: 'workspace-id-123' })
})

// Success response schema
const GetAllWorkspaceProjectsSuccessResponse = z.object({
    messages: z.string().openapi({ example: 'success' }),
    data: z.array(project).openapi({ description: 'List of projects in the workspace' })
})

// Error response schema
const GetAllWorkspaceProjectsErrorResponse = z.object({
    message: z.string().openapi({ example: 'invalid or empty workspace ID' })
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const getAllWorkspaceProjectsRoute = createRoute({
    method: 'get',
    path: '/project/:workspaceId',
    request: {
        params: GetAllWorkspaceProjectsParams
    },
    responses: {
        200: {
            description: 'Successfully retrieved all projects in the workspace',
            content: {
                'application/json': {
                    schema: GetAllWorkspaceProjectsSuccessResponse
                }
            }
        },
        400: {
            description: 'Invalid or empty workspace ID',
            content: {
                'application/json': {
                    schema: GetAllWorkspaceProjectsErrorResponse
                }
            }
        },
        500: {
            description: 'Server error',
            content: {
                'application/json': {
                    schema: GetAllWorkspaceProjectsErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default getAllWorkspaceProjectsRoute
