import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import * as database from "@org/database"

// Request body schema
// Success response schema
const ForgotPasswordSuccessResponse = z.object({
    status: z.number().openapi({ example: 200 }),
    message: z.string().openapi({ example: 'forgotten password successfully, check your email' }),
    token: z.string().openapi({ example: 'abc123hashedtoken' }),
    email: z.string().email().openapi({ example: 'user@example.com' })
})

// Error response schema (400 or 404)
const ErrorResponse = z.object({
    status: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: 'user not found' })
})

// Create the route
export const forgotPasswordRoute = createRoute({
    method: 'post',
    path: '/auth/forgot-password',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: database.user.omit({ firstname: true, lastname: true, password: true })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Forgot password success',
            content: {
                'application/json': {
                    schema: ForgotPasswordSuccessResponse
                }
            }
        },
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        },
        404: {
            description: 'User not found',
            content: {
                'application/json': {
                    schema: ErrorResponse
                }
            }
        }
    }
})

export default forgotPasswordRoute