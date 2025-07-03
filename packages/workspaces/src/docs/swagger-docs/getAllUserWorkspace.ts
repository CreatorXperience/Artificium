import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { workspace } from '@org/database'



// Success response schema
const GetAllUserWorkspaceResponse = z.object({
    messages: z.string().openapi({ example: 'success' }),
    data: z.object({
        personalWorkspaces: z.array(workspace),
        publicWorkspace: z.array(workspace)
    })
})

// Create route
const getAllUserWorkspaceRoute = createRoute({
    method: 'get',
    path: '/all',
    responses: {
        200: {
            description: 'Fetched user workspaces and public workspaces',
            content: {
                'application/json': {
                    schema: GetAllUserWorkspaceResponse
                }
            }
        }
    }
})


export default getAllUserWorkspaceRoute