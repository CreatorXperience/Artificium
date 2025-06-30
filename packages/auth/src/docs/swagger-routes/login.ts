import { createRoute } from "@hono/zod-openapi";
import { user } from "@org/database";
import z from "zod"

const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: user.omit({ firstname: true, lastname: true }),
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Login successful',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.number(),
                        message: z.string(),
                        data: z.object({
                            id: z.string(),
                            email: z.string(),
                            firstname: z.string(),
                            lastname: z.string(),
                            isVerified: z.boolean(),
                            image: z.string(),
                            username: z.null()
                        }) // You can replace this with your user object minus password
                    })
                }
            }
        },
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.number(),
                        message: z.string()
                    })
                }
            }
        }
    }
})

export default loginRoute