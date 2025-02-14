import { Hono } from 'hono';

const auth = new Hono().basePath('/auth');

auth.post('/login', (c) => {
  return c.text('login');
});

auth.post('/signup', (c) => {
  return c.text('signup');
});

export default auth;
