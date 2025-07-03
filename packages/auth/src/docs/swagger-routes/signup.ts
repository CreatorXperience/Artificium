import { createRoute } from "@hono/zod-openapi";
import { user } from "@org/database";
import z from "zod"

const signupRoute = createRoute({
    method: 'post',
    path: '/signup',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: user
                }
            }
        }
    },
    responses: {
        200: {
            description: 'User created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.number().openapi({ example: 200 }),
                        message: z.string().openapi({ example: 'user created successfully' }),
                        data: z.object({
                            id: z.string(),
                            email: z.string(),
                            firstname: z.string(),
                            lastname: z.string(),
                            isVerified: z.boolean(),
                            image: z.string(),
                            username: z.null()
                        })
                    })
                }
            }
        },
        400: {
            description: 'Validation failed or user already exists',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.number().openapi({ example: 400 }),
                        message: z.string().openapi({ example: 'user already exists' })
                    })
                }
            }
        }
    }
})

export default signupRoute