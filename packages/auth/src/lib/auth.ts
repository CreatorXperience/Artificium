import { Hono } from 'hono';
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
import winston = require('winston');

const app = new Hono().basePath('/auth');

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
