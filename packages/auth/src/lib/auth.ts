import { Hono } from 'hono';
import {
  login,
  logout,
  signup,
  sendOtp,
  verifyOtp,
} from '../controllers/auth.controller';
import auth from '../middlewares/auth.middleware';

const app = new Hono().basePath('/auth');
app.post('/login', login);

app.post('/signup', signup);

app.get('/otp', auth, sendOtp);

app.post('/verify/otp', auth, verifyOtp);

app.delete('/logout', auth, logout);

export default app;
