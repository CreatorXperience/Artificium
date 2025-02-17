import { Hono } from 'hono';

const app = new Hono().basePath('/auth');

app.post('/login', (c) => {
  return c.text('login');
});

app.post('/signup', (c) => {
  return c.text('signup');
});

export { app };
