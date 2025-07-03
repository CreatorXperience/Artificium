import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { project } from '@org/database' // Replace with your actual project model type
import { datetimeRegex } from 'zod'

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Params schema
const UpdateProjectParams = z.object({
    projectId: z.string().openapi({ example: 'project-id-456' })
})

// Request body schema (example for updating project fields, adjust as needed)
const UpdateProjectRequestBody = z.object({
    name: z.string().optional().openapi({ example: 'New Project Name' }),
    purpose: z.string().optional().openapi({ example: 'Updated project purpose' }),
    // Add other updatable fields here
}).openapi('UpdateProjectRequestBody')

// Success response schema
const UpdateProjectSuccessResponse = z.object({
    message: z.string().openapi({ example: 'project updated successfully' }),
    data: project
})

// Error response schema
const UpdateProjectErrorResponse = z.object({
    message: z.string().openapi({ example: 'Validation Error: field is required' })
})

// Not found response schema
const UpdateProjectNotFoundResponse = z.object({
    message: z.string().openapi({ example: "project doesn't exist" })
})

// -------------------------
// ROUTE DEFINITION
// -------------------------

const updateProjectRoute = createRoute({
    method: 'patch',
    path: '/project/{projectId}',
    request: {
        params: UpdateProjectParams,
        body: {
            content: {
                'application/json': {
                    schema: UpdateProjectRequestBody
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Project updated successfully',
            content: {
                'application/json': {
                    schema: UpdateProjectSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: UpdateProjectErrorResponse
                }
            }
        },
        404: {
            description: 'Project not found',
            content: {
                'application/json': {
                    schema: UpdateProjectNotFoundResponse
                }
            }
        },
        500: {
            description: 'Server error',
            content: {
                'application/json': {
                    schema: UpdateProjectErrorResponse
                }
            }
        }
    }
})

export default updateProjectRoute
