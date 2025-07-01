import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { ObjectId } from 'mongodb'

// Mocked workspace member schema — update with actual fields as needed
const WorkspaceMemberSchema = z.object({
    id: z.string().openapi({ example: 'member-id-123' }),
    userId: z.string().openapi({ example: 'user-id-456' }),
    workspaceId: z.string().openapi({ example: 'workspace-id-789' }),
    role: z.string().openapi({ example: 'admin' }) // if your model has a role field
})

// Success response schema
const GetWorkspaceMembersResponse = z.object({
    message: z.string().openapi({ example: 'success' }),
    data: z.array(WorkspaceMemberSchema)
})

// Create the route
const getWorkspaceMembersRoute = createRoute({
    method: 'get',
    path: '/members',
    request: {
        query: z.object({
            workspaceId: z.string().openapi({ example: new ObjectId().toHexString() })
        })
    },
    responses: {
        200: {
            description: 'Fetched workspace members',
            content: {
                'application/json': {
                    schema: GetWorkspaceMembersResponse
                }
            }
        }
    }
})


export default getWorkspaceMembersRoute