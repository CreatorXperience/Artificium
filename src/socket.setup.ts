import { serve } from "@hono/node-server";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { BlankEnv, BlankSchema } from "hono/types";
import { MongoClient } from "mongodb";
import { Server } from "socket.io";
import { chatInGroups, chatWithArtificium, logger } from './socketUtils';
import { customEmitter } from '@org/workspaces';
import { Emitter } from '@socket.io/mongo-emitter';
import { createAdapter } from '@socket.io/mongo-adapter';
const PORT = Number(process.env.port) || 3030;
const prisma = new PrismaClient();
const setupSocket = (app: Hono<BlankEnv, BlankSchema, "/">) => {
    let onlineUsers: Array<TOnline> = [];
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
    type TRoomPayload = { channelId: string; userId: string; username: string, channelName: string };
    type TArtificiumChatType = {
        userId?: string;
        text?: string;
        projectId?: string;
        user?: string;
        threadId?: string;
        workspaceId?: string;
        artificiumId?: string;

    };

    type TUserChatType = Omit<TArtificiumChatType, "artificiumId"> & { channelId?: string; };
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
                    });
                    socket.on('get_new_notification', async (userId) => {
                        const notification = await prisma.notification.findFirst({
                            where: { userId: userId, status: false },
                        });
                        if (notification) {
                            return emitter.to(userId).emit(JSON.stringify(notification))
                        }
                        emitter.to(userId).emit(null);
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

                    socket.on('join_room', (payload: any) => {
                        socket.join(payload.channelId);
                        emitter.to(payload.channelId).emit("join_response", "join sent successfully")
                    });

                    socket.on('leave_room', (payload: TRoomPayload) => {
                        socket.leave(payload.channelId);

                        onlineUsers.filter((item) => item.userId === payload.userId);
                        emitter
                            .to(payload.channelId)
                            .emit("leave", `${payload.username} left the room`);
                    });
                });

                customEmitter.on('inapp-notification', async (data: string) => {
                    const notifications = JSON.parse(data) as Array<{
                        userId: string;
                    }>;
                    notifications.forEach((data) => {
                        emitter
                            .to(data.userId)
                            .emit('new_notification', "new notifications");
                    })
                });


            } catch (e) {
                console.log('❌ error creating database');
            }
        })
        .catch((err) => {
            console.log('error occured while connecting to mongodb', err);
        });

    return app
}

export default setupSocket