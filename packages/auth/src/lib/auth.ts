import { Hono } from 'hono';
import { getToken, login } from '../controllers/auth.controller';

const app = new Hono().basePath('/auth');

app.get('/token', getToken);

app.post('/login', login);

app.post('/signup', (c) => {
  return c.text('signup');
});

export { app };
