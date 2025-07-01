import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'


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
const GetProjectMembershipQuery = z.object({
    workspaceId: z.string().openapi({ example: 'workspace-id-123' }),
    projectId: z.string().openapi({ example: 'project-id-456' }),
    workspaceMembershipId: z.string().openapi({ example: 'member-id-789' })
})

// Success response
const ProjectMembershipSuccessResponse = z.object({
    message: z.string().openapi({
        example: 'project membership retrieved successfully'
    }),
    data: projectMember
})

// Not a member response
const NotMemberResponse = z.object({
    message: z.string().openapi({
        example: 'you are not a member of this project.'
    }),
    data: z.null()
})

// Generic error response
const ProjectMembershipErrorResponse = z.object({
    message: z.string().openapi({
        example: "Invalid params id's"
    })
})

// -------------------------
// ROUTE
// -------------------------

const getProjectMembershipRoute = createRoute({
    method: 'get',
    path: '/project/membership',
    request: {
        query: GetProjectMembershipQuery
    },
    responses: {
        200: {
            description: 'Project membership retrieved successfully',
            content: {
                'application/json': {
                    schema: ProjectMembershipSuccessResponse
                }
            }
        },
        400: {
            description: 'Invalid param ids',
            content: {
                'application/json': {
                    schema: ProjectMembershipErrorResponse
                }
            }
        },
        404: {
            description: 'Not a project member or membership not found',
            content: {
                'application/json': {
                    schema: NotMemberResponse
                }
            }
        }
    }
})

// -------------------------
// EXPORT
// -------------------------

export default getProjectMembershipRoute
