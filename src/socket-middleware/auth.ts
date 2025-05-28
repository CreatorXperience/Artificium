import { PrismaClient } from '@prisma/client';
import { getSignedCookie } from 'hono/cookie';
import {} from 'hono/utils/cookie';
import { parse } from 'cookie';
import { V4 } from 'paseto';
import { DefaultEventsMap, ExtendedError, Socket } from 'socket.io';
type TUSignatureObj = { userId: string };
const auth = async (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>,
  next: (error?: ExtendedError) => void
) => {
  // const rawCookie = socket.handshake.headers.cookie;
  // const parsed_cookie = parse(rawCookie);
  // const prisma = new PrismaClient();
  // const token = await getSignedCookie(
  //   rawCookie,
  //   process.env.SECRET,
  //   'signed_key'
  // );
  // if (token) {
  //   const session = await prisma.session.findUnique({ where: { token } });
  //   const key = V4.bytesToKeyObject(Buffer.from(session.key) as Buffer);
  //   const user = (await V4.verify(token, key)) as TUSignatureObj;
  //   const isExistingUser = await prisma.user.findUnique({
  //     where: { id: user.userId },
  //   });
  //   if (isExistingUser) {
  //     // c.set('getUser', () => isExistingUser);
  //     next();
  //   } else {
  //     //   c.status(401);
  //     //   return c.json({ message: 'Unauthorized user.', status: 401 });
  //   }
  // }
  //   c.status(401);
  //   return c.json({ message: 'Unauthorized user', status: 401 });
};
