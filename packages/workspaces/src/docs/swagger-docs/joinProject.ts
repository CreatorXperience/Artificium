import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { project } from '@org/database' // Replace with actual model


// -------------------------
// ZOD SCHEMAS
// -------------------------

const projectMember = z.object({
    workspaceId: z.string(),
    projectId: z.string(),
    id: z.string(),
    name: z.string(),
    image: z.string(),
    userId: z.string(),
    email: z.string().email(),  // assuming email should be valid
    role: z.string(),
    memberId: z.string(),
});

// Query params
const JoinProjectQuery = z.object({
    projectId: z.string().openapi({ example: 'project-id-123' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-456' })
})

// Success response
const JoinProjectSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'You have joined the project: Welcome Project'
    }),
    data: project,
    projectMembership: projectMember
})

// Already member response
const AlreadyProjectMemberResponse = z.object({
    message: z.string().openapi({
        example: 'Already a member of this project'
    }),
    projectMembership: projectMember
})

// Error response
const JoinProjectErrorResponse = z.object({
    message: z.string().openapi({
        example: 'Invalid project or workspace ID'
    })
})

// -------------------------
// ROUTE
// -------------------------

const joinProjectRoute = createRoute({
    method: 'post',
    path: '/project/join',
    request: {
        query: JoinProjectQuery
    },
    responses: {
        200: {
            description: 'User successfully joined the project',
            content: {
                'application/json': {
                    schema: JoinProjectSuccessResponse
                }
            }
        },
        201: {
            description: 'User already a member of the project',
            content: {
                'application/json': {
                    schema: AlreadyProjectMemberResponse
                }
            }
        },
        400: {
            description: 'Invalid project or workspace ID',
            content: {
                'application/json': {
                    schema: JoinProjectErrorResponse
                }
            }
        },
        404: {
            description: 'Project or workspace not found, or user not part of workspace',
            content: {
                'application/json': {
                    schema: JoinProjectErrorResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default joinProjectRoute
