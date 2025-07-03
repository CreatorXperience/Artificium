import {
  login,
  logout,
  signup,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import auth from '../middlewares/auth.middleware';
import customFormat from '../utils/customFormat';
import { swaggerUI } from "@hono/swagger-ui"
import winston = require('winston');
import { OpenAPIHono } from '@hono/zod-openapi'
import loginRouteDoc from '../docs/swagger-routes/login';
import signupRoute from '../docs/swagger-routes/signup';
import otpRoute from '../docs/swagger-routes/otp';
import verifyOtpRoute from '../docs/swagger-routes/verifyOtp';
import forgotPasswordRoute from '../docs/swagger-routes/forgotPassword';
import resetPasswordRoute from '../docs/swagger-routes/resetPassword';
import logoutRoute from '../docs/swagger-routes/logout';
const app = new OpenAPIHono().basePath('/auth');

winston.createLogger({
  level: 'error',
  format: customFormat,
  exceptionHandlers: [
    new winston.transports.File({ level: 'error', filename: 'error.log' }),
    new winston.transports.Console({ level: 'error' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ level: 'error', filename: 'error.log' }),
    new winston.transports.Console({ level: 'error' }),
  ],
  handleExceptions: true,
  handleRejections: true,
  transports: [
    new winston.transports.File({ level: 'error', filename: 'error.log' }),
    new winston.transports.Console({ level: 'error' }),
    new winston.transports.Console({ level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== "development") {
  app.openapi(loginRouteDoc, login as never)
  app.openapi(signupRoute, signup as never)
  app.openapi(otpRoute, sendOtp as never)
  app.openapi(verifyOtpRoute, verifyOtp as never)
  app.openapi(forgotPasswordRoute, forgotPassword as never)
  app.openapi(resetPasswordRoute, resetPassword as never)
  app.openapi(logoutRoute, logout as never)
}


app.get("/swagger", swaggerUI({ url: "/auth/docs" }))

app.doc("docs", {
  info: {
    title: "Artificium Auth swagger docs",
    version: "v1"
  },
  openapi: "3.1.0"
})
app.post('/login', login);

app.post('/signup', signup);

app.get('/otp', auth, sendOtp);

app.post('/verify-otp', auth, verifyOtp);

app.post('/forgot-password', forgotPassword);

app.post('/reset-password', resetPassword);

app.delete('/logout', auth, logout);

app.onError((err, c) => {
  return c.json(
    {
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    500
  );
});

export default app;
