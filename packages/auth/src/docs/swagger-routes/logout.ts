import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// Success response schema
const LogoutSuccessResponse = z.object({
    message: z.string().openapi({ example: 'cookie removed successfully' }),
    status: z.number().openapi({ example: 200 })
})

// Create logout route
const logoutRoute = createRoute({
    method: 'delete',
    path: '/logout',
    responses: {
        200: {
            description: 'User logged out, cookie removed',
            content: {
                'application/json': {
                    schema: LogoutSuccessResponse
                }
            }
        }
    }
})


export default logoutRoute