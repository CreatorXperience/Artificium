import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { auth } from '@org/auth';
import { users } from '@org/users';
import { workspace } from '@org/workspaces';
import { integration } from "@org/integrations"
import { Server } from 'socket.io';
import { chatInGroups, chatWithArtificium, logger } from './socketUtils';
import { MongoClient } from 'mongodb';
import { createAdapter } from '@socket.io/mongo-adapter';
import dotenv from 'dotenv';
import { Emitter } from '@socket.io/mongo-emitter';
import winston from 'winston';
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client';
import { customEmitter } from '@org/workspaces';
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
const prisma = new PrismaClient();
const app = new Hono();
const PORT = Number(process.env.port) || 3030;
const server = serve({ fetch: app.fetch, port: PORT });
const io = new Server(server, { cors: { allowedHeaders: ['*'], origin: '*' } });

const MONGO_URL =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL
    : process.env.DATABASE_URL;

const client = new MongoClient(MONGO_URL);
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
    logger.log('info', '🔗 connected to mongodb database successfully');
    try {
      const collection = await client.db(DB_NAME).createCollection(COLLECTION, {
        capped: true,
        size: 1e6,
      });
      io.adapter(createAdapter(collection));

      const emitter = new Emitter(collection);

      io.use((socket, next) => {
        const cookie = socket.handshake.headers.cookie;
        next();
      });
      io.on('connection', (socket) => {
        socket.on('subscribe', (userId) => {
          socket.join(userId);
          console.log('registration successfull');
        });
        socket.on('get_notification', async (userId) => {
          const notification = await prisma.notification.findMany({
            where: { userId: userId },
          });
          if (notification && notification.length > 0) {
            return emitter.to(userId).emit(JSON.stringify(notification));
          }
          emitter.to(userId).emit('Empty notification');
        });

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

      customEmitter.on('inapp-notification', async (members_id: string) => {
        const parsed_member_id = JSON.parse(members_id) as Array<{
          userId: string;
          notificationId: string;
        }>;
        for (const memberNotification of parsed_member_id) {
          const notification = await prisma.notification.findUnique({
            where: {
              id: memberNotification.notificationId,
              userId: memberNotification.userId,
            },
          });

          emitter
            .to(memberNotification.userId)
            .emit('new_notification', JSON.stringify(notification));
        }
      });
    } catch (e) {
      console.log('❌ error creating database');
    }
  })
  .catch((err) => {
    console.log('error occured while connecting to mongodb', err);
  });

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
  app.route('/', workspace);
  app.route("/", integrationRoute)

}





registerRoutes()
export default app;
