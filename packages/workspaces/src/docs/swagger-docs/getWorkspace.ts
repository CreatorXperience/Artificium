import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { workspace } from '@org/database' // Replace with your actual workspace Zod schema

// -------------------------
// ZOD SCHEMAS
// -------------------------

const GetWorkspaceParams = z.object({
    id: z.string().openapi({
        example: 'workspace-id-123',
        description: 'The ID of the workspace to fetch'
    })
})

const GetWorkspaceSuccessResponse = z.object({
    messages: z.string().openapi({
        example: 'success'
    }),
    data: workspace.nullable().openapi({
        description: 'Workspace data if found, otherwise null'
    })
})

const ErrorResponse = z.object({
    message: z.string().openapi({
        example: 'workspace not found'
    })
})

// -------------------------
// ROUTE
// -------------------------

const getWorkspaceRoute = createRoute({
    method: 'get',
    path: '/:id',
    request: {
        params: GetWorkspaceParams
    },
    responses: {
        200: {
            description: 'Successfully fetched workspace (or null if not found)',
            content: {
                'application/json': {
                    schema: GetWorkspaceSuccessResponse
                }
            }
        },
        400: {
            description: "workspace not found",
            content: {
                "application/json": {
                    schema: ErrorResponse
                }
            }
        }
    }
})

export default getWorkspaceRoute
