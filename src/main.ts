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

const client = new MongoClient(
  'mongodb+srv://VeloxGrid:clBGQcjY2sVIvQtF@cluster1.tfrsr.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster1'
);
const DB_NAME = 'socketio-adapter-database';
const COLLECTION = 'socketio-events';
type TOnline = { userId: string; socketId: string; username: string };
type TRoomPayload = { channelName: string; userId: string; username: string };
type TArtificiumChatType = {
  text?: string;
  userId?: string;
  projectId?: string;
  user?: string;
  threadId?: string;
};

type TUserChatType = TArtificiumChatType;

let onlineUsers: Array<TOnline> = [];

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

        // const parsed_cookie = parse(cookie);
        // console.log(parsed_cookie);
        // console.log('hi');
        next();
      });
      io.on('connection', (socket) => {
        socket.on('online', (payload: Omit<TOnline, 'socketId'>) => {
          onlineUsers = onlineUsers.filter(
            (item) => item.userId !== payload.userId
          );
          onlineUsers.push({
            socketId: socket.id,
            userId: payload.userId,
            username: payload.username,
          });

          emitter.emit('online_user', JSON.stringify(onlineUsers));
        });
        emitter.emit('⚡️ connection established successfully');
        socket.on('echo', () => {
          emitter.emit(' Welcome to the Artificium world');
        });

        socket.on('chat_with_artificium', (payload: TArtificiumChatType) => {
          chatWithArtificium(payload, emitter);
        });

        socket.on('chat_in_groups', (payload: TUserChatType) => {
          chatInGroups(payload, emitter);
        });

        socket.on('create_room', (payload: TRoomPayload) => {
          socket.join(payload.channelName);

          emitter.to(payload.channelName).emit('Channel Created');
        });

        socket.on('leave_room', (payload: TRoomPayload) => {
          socket.leave(payload.channelName);

          onlineUsers.filter((item) => item.userId === payload.userId);
          emitter
            .to(payload.channelName)
            .emit(`${payload.username} left the room`);
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
