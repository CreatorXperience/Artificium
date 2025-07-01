import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

// Request body schema
const ResetPasswordPayload = z.object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    token: z.string().openapi({ example: 'somehashedtoken' }),
    password: z.string().min(6).openapi({ example: 'newpassword123' })
})

// Success response
const ResetPasswordSuccessResponse = z.object({
    message: z.string().openapi({ example: 'password updated successfully' }),
    data: z.object({
        email: z.string().email().openapi({ example: 'user@example.com' }),
        firstname: z.string().email().openapi({ example: 'user@example.com' }),
        lastname: z.string().openapi({ example: 'segun' }),
        isVerified: z.string()
        // add other user fields if needed
    })
})

// Error response (400 or 404)
const ErrorResponse = z.object({
    message: z.string().openapi({ example: 'bad token, try again' }),
})

// Create the route
const resetPasswordRoute = createRoute({
    method: 'post',
    path: '/reset-password',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: ResetPasswordPayload
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Password updated successfully',
            content: {
                'application/json': {
                    schema: ResetPasswordSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error or bad token',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        },
        404: {
            description: 'Forgot session expired or token expired',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        }
    }
})

export default resetPasswordRoute