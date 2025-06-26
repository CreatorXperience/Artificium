import { Hono } from 'hono';
import { auth } from '@org/auth';
import { users } from '@org/users';
import { workspace } from '@org/workspaces';
import { integration } from "@org/integrations"
import dotenv from 'dotenv';
import winston from 'winston';
import { cors } from 'hono/cors';
import setupSocket from './socket.setup';
dotenv.config();

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

let app = new Hono();
app = setupSocket(app)
app.use('*', cors());

app.get('/', (c) => {
  return c.text('Hello world');
});

app.get('/me', (c) => {
  return c.json({ name: 'habeeb' });
});

async function registerRoutes() {
  const integrationRoute = await integration()
  app.route('/', auth);
  app.route('/', users);
  app.route('/', workspace.getWorkspaceApp());
  app.route("/", integrationRoute.getIntegrationApp())

}





registerRoutes()
export default app;
