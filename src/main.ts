import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { auth } from '@org/auth';
import { users } from '@org/users';
import { workspace } from '@org/workspaces';
import { Server } from 'socket.io';
import { chatInGroups, chatWithArtificium } from './socketUtils';
import { MongoClient } from 'mongodb';
import { createAdapter } from '@socket.io/mongo-adapter';
import dotenv from 'dotenv';
import { Emitter } from '@socket.io/mongo-emitter';
import winston from 'winston';
import { cors } from 'hono/cors';
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

const app = new Hono();
const PORT = Number(process.env.port) || 3030;
const server = serve({ fetch: app.fetch, port: PORT });
const io = new Server(server, { cors: { allowedHeaders: ['*'], origin: '*' } });

const MONGO_URL =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL;

const client = new MongoClient(MONGO_URL);
const DB_NAME = 'socketio-adapter-database';
const COLLECTION = 'socketio-events';

client
  .connect()
  .then(async (client) => {
    console.log('🔗 connected to mongodb database successfully');
    try {
      const collection = await client.db(DB_NAME).createCollection(COLLECTION, {
        capped: true,
        size: 1e6,
      });
      io.adapter(createAdapter(collection));

      const emitter = new Emitter(collection);

      // setInterval(() => emitter.emit('something', 'HEllo my people'), 2000);

      io.use((socket, next) => {
        const cookie = socket.handshake.headers.cookie;
        next();
      });
      io.on('connection', (socket) => {
        socket.emit('⚡️ connection established successfully');
        socket.on('echo', () => {
          socket.emit(' Welcome to the Artificium world');
        });

        socket.on('chat_with_artificium', (payload) => {
          chatWithArtificium(payload, emitter);
        });

        socket.on('chat_in_groups', (payload) => {
          chatInGroups(payload, emitter);
        });
      });
    } catch (e) {
      console.log('❌ error creating database');
    }
  })
  .catch((err) => {
    console.log('error occured while connecting to mongodb');
  });

app.use('*', cors());
app.get('/', (c) => {
  return c.text('Hello world');
});

app.get('/me', (c) => {
  return c.json({ name: 'habeeb' });
});

app.route('/', auth);
app.route('/', users);
app.route('/', workspace);
export default app;
