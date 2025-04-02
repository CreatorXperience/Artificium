import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { auth } from '@org/auth';
import { users } from '@org/users';
import { workspace } from '@org/workspaces';
import winston from 'winston';
const app = new Hono();
const PORT = Number(process.env.port) || 3030;
winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  exceptionHandlers: [
    new winston.transports.File({ level: 'error', filename: 'main-error.log' }),
  ],
  transports: [
    new winston.transports.File({ level: 'error', filename: 'main-error.log' }),
    new winston.transports.Console({ level: 'error' }),
  ],
});

app.get('/', (c) => {
  return c.text('Hello world');
});

app.get('/me', (c) => {
  return c.json({ name: 'habeeb' });
});

app.route('/', auth);
app.route('/', users);
app.route('/', workspace);
serve({ fetch: app.fetch, port: PORT });
export default app;
