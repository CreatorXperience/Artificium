import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { workspace } from '@org/database' // Replace with your actual workspace Zod schema

// -------------------------
// ZOD SCHEMAS
// -------------------------

const CreateWorkspaceBody = z.object({
    name: z.string().openapi({
        example: 'My New Workspace',
        description: 'Name of the workspace to create'
    }),
    description: z.string().optional().openapi({
        example: 'A description for the workspace',
        description: 'Optional workspace description'
    })
    // Add any other fields required by your workspaceValidator
})

const CreateWorkspaceSuccessResponse = z.object({
    messages: z.string().openapi({
        example: 'workspace created'
    }),
    data: workspace
})

const ValidationErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation Error: name is required'
    }),
})

const ConflictErrorResponse = z.object({
    message: z.string().openapi({
        example: 'workspace with the same name already exist'
    })
})

// -------------------------
// ROUTE
// -------------------------

const createWorkspaceRoute = createRoute({
    method: 'post',
    path: '/',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateWorkspaceBody
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Workspace created successfully',
            content: {
                'application/json': {
                    schema: CreateWorkspaceSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: ValidationErrorResponse
                }
            }
        },
        401: {
            description: 'Workspace with the same name already exists',
            content: {
                'application/json': {
                    schema: ConflictErrorResponse
                }
            }
        }
    }
})

export default createWorkspaceRoute
