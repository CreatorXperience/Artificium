import { Hono } from 'hono';

const app = new Hono().basePath('/user');

app.post('/profile', (c) => {
  return c.text('user profile');
});

export default app;
