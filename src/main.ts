import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import auth from './routes/auth.routes';
const app = new Hono();
const PORT = Number(process.env.port) || 3030;

app.get('/', (c) => {
  return c.text('Hello world');
});

app.get('/me', (c) => {
  return c.json({ name: 'habeeb' });
});

app.route('/', auth);
serve({ fetch: app.fetch, port: PORT });
export default app;
