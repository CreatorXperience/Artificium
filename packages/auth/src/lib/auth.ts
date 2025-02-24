import { Hono } from 'hono';
import { login, logout, signup } from '../controllers/auth.controller';

const app = new Hono().basePath('/auth');
app.post('/login', login);

app.post('/signup', signup);

app.delete('/logout', logout);

export default app;
