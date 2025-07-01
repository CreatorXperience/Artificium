import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { project } from '@org/database' // Replace with your actual project type

// -------------------------
// ZOD SCHEMAS
// -------------------------

// Project member schema
const ProjectMemberSchema = z.object({
    image: z.string().url().optional().openapi({ example: 'https://example.com/image.png' }),
    name: z.string().openapi({ example: 'John Doe' }),
    memberId: z.string().openapi({ example: 'member-id-123' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-456' }),
    email: z.string().email().openapi({ example: 'john@example.com' }),
    userId: z.string().openapi({ example: 'user-id-789' })
})

// Project body schema
const CreateProjectBody = z.object({
    workspaceId: z.string().openapi({ example: 'workspace-id-456' }),
    name: z.string().openapi({ example: 'New Project' }),
    purpose: z.string().optional().openapi({ example: 'Project purpose description' }),
    members: z.array(ProjectMemberSchema).optional()
})

// Success response
const CreateProjectSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'Project successfully created'
    }),
    data: project
})

// Error response
const CreateProjectErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Validation error: name is required'
    })
})

// -------------------------
// ROUTE
// -------------------------

const createNewWorkspaceProjectRoute = createRoute({
    method: 'post',
    path: '/project',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateProjectBody
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Project successfully created',
            content: {
                'application/json': {
                    schema: CreateProjectSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error or malformed ObjectId',
            content: {
                'application/json': {
                    schema: CreateProjectErrorResponse
                }
            }
        },
        404: {
            description: 'Workspace not found',
            content: {
                'application/json': {
                    schema: CreateProjectErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default createNewWorkspaceProjectRoute
