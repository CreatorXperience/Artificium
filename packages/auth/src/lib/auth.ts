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

const app = new Hono().basePath('/auth');

app.post('/login', login);

app.post('/signup', signup);

app.get('/otp', auth, sendOtp);

app.post('/verify-otp', auth, verifyOtp);

app.post('/forgot-password', forgotPassword);

app.post('/reset-password', resetPassword);

app.delete('/logout', auth, logout);

export default app;
