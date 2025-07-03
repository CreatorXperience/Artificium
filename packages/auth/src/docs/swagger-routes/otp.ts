import { createRoute, z } from "@hono/zod-openapi";

const otpRoute = createRoute({
    method: 'get',
    path: "/otp",
    responses: {
        200: {
            description: "retrieve otp",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        data: z.any(),
                    })
                }
            }
        }
    }
})

export default otpRoute