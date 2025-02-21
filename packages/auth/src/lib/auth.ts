import { Hono } from 'hono';
import { login, logout } from '../controllers/auth.controller';
import auth from '../middlewares/auth.middleware';

const app = new Hono().basePath('/auth');
app.post('/login', login);

app.post('/signup', auth, (c) => {
  return c.text('signup');
});

app.delete('/logout', logout);

export { app };
