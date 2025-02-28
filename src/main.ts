import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { auth } from '@org/auth';
import { users } from '@org/users';
const app = new Hono();
const PORT = Number(process.env.port) || 3030;
app.get('/', (c) => {
  return c.text('Hello world');
});

app.get('/me', (c) => {
  return c.json({ name: 'habeeb' });
});

app.route('/', auth);
app.route('/', users);
serve({ fetch: app.fetch, port: PORT });
export default app;
