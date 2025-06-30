import { artificiumMessagePayloadValidator, userMessagePayloadValidator } from '@org/database';
import { PrismaClient } from '@prisma/client';
import { Emitter } from '@socket.io/mongo-emitter';
import { ObjectId } from 'mongodb';
import { workspace } from "@org/workspaces"

import { DefaultEventsMap } from 'socket.io';
import winston from 'winston';

const logger = new winston.Logger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: new winston.transports.Console(),
});


const prisma = new PrismaClient();

const MAX_CACHE_SIZE = 2;



const redis = workspace.getRedis()

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

const chatWithArtificium = async (
  payload: any,
  socket: Emitter<DefaultEventsMap, DefaultEventsMap>,
) => {
  const { error, data } = artificiumMessagePayloadValidator(payload);
  if (error) {
    return socket.emit(
      'socket-validation-error',
      JSON.stringify({
        message: error.errors[0].message,
        status: 400,
      })
    );
  }
  const message_length = await redis.client.LLEN('art_message');
  if (message_length >= MAX_CACHE_SIZE) {
    const messages = await redis.client.LRANGE('art_message', 0, 50);
    const parsed_messages = messages
      .map((message) => ({
        ...JSON.parse(message),
        timestamp: new Date(JSON.parse(message).timestamp),
      }))
      .reverse();
    await prisma.artificiumChat.createMany({
      data: [...parsed_messages],
    });

    await redis.client.LTRIM('art_message', 50, -1);
  }

  await redis.client.LPUSH(
    'art_message',
    JSON.stringify({
      id: new ObjectId().toHexString(),
      timestamp: Date.now(),
      ...data,
    })
  );

  //send a request to the AI then emit the response


  socket.to(data.userId).emit("new_art_message", {
    message: '📤 message sent successfully',
  })
};

const chatInGroups = async (
  payload: any,
  socket: Emitter<DefaultEventsMap, DefaultEventsMap>,
) => {
  const { error, data } = userMessagePayloadValidator(payload);
  if (error) {
    return socket.emit('socket-validation-error', {
      message: error.errors[0].message,
      status: 400,
    });
  }
  const message_length = await redis.client.LLEN('chat_messages');
  if (message_length >= MAX_CACHE_SIZE) {
    const messages = await redis.client.LRANGE('chat_messages', 0, 50);
    const parsed_messages = messages
      .map((message) => {
        return {
          ...JSON.parse(message),
          timestamp: new Date(JSON.parse(message).timestamp),
        }
      })
      .reverse();
    await prisma.message.createMany({
      data: [...parsed_messages],
    });

    await redis.client.LTRIM('chat_messages', 50, -1);
  }

  const messageId = new ObjectId().toHexString()
  await redis.client.LPUSH(
    'chat_messages',
    JSON.stringify({
      id: messageId,
      timestamp: Date.now(),
      ...data,
    })
  );

  if (data.text.includes('@artificium')) {
    //send a request to the AI and return the response then emit the response
  }

  socket.to(data.channelId).emit("new_message", { message: '📤 message sent successfully', data: { messageId } });
};

export { chatWithArtificium, chatInGroups, logger };
