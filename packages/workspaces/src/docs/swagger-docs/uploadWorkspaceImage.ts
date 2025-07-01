import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { workspace } from '@org/database' // Replace with your actual workspace type

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Query param for workspace ID
const UploadWorkspaceImageQuery = z.object({
    workspaceId: z.string().openapi({
        example: 'workspace-id-123',
        description: 'ID of the workspace'
    })
})

// Success response
const UploadImageSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'message uploaded successfully'
    }),
    data: workspace
})

// Generic error response
const UploadImageErrorResponse = z.object({
    message: z.string().openapi({
        example: 'workspace not found'
    })
})

// -------------------------
// ROUTE
// -------------------------

const uploadWorkspaceImageRoute = createRoute({
    method: 'post',
    path: '/upload',
    request: {
        query: UploadWorkspaceImageQuery
    },
    responses: {
        200: {
            description: 'Image uploaded successfully',
            content: {
                'application/json': {
                    schema: UploadImageSuccessResponse
                }
            }
        },
        400: {
            description: 'Bad request (e.g. invalid object ID, no file uploaded, file too large)',
            content: {
                'application/json': {
                    schema: UploadImageErrorResponse
                }
            }
        },
        404: {
            description: 'Workspace not found or Cloudinary error',
            content: {
                'application/json': {
                    schema: UploadImageErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default uploadWorkspaceImageRoute
