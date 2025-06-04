import { Hono } from 'hono';
import { authMiddleWare } from '@org/auth';
import {
  createOrEditUsername,
  uploadProfile,
} from '../controllers/profile-upload';

const app = new Hono().basePath('/user');
app.post('/profile/upload', authMiddleWare, uploadProfile);
app.post('/profile/username', authMiddleWare, createOrEditUsername);

export default app;
