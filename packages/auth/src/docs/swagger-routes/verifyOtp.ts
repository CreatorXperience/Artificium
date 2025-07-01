import { createRoute } from "@hono/zod-openapi";
import { otp } from "@org/database";
import z from "zod"

const verifyOtpRoute = createRoute({
    method: 'post',
    path: '/verify-otp',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: otp.omit({ createdAt: true, expiresIn: true, userId: true })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'OTP verified successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.number().openapi({ example: 200 }),
                        message: z.string().openapi({ example: 'OTP verified' }),
                        data: z.any().optional() // You can refine if you know the shape
                    })
                }
            }
        },
        400: {
            description: 'Validation failed',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string().openapi({ example: 'Invalid OTP format' })
                    })
                }
            }
        },
        404: {
            description: 'OTP invalid or expired',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.number().openapi({ example: 404 }),
                        message: z.string().openapi({ example: 'otp expired' })
                    })
                }
            }
        }
    }
})

export default verifyOtpRoute