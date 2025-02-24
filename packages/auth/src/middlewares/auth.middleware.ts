import { Context, Next } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { V4 } from 'paseto';
import { PrismaClient } from '@prisma/client';

type TUSignatureObj = { userId: string };
type TMiddlewareContext = {
  Variables: {
    getUser: () => TUSignatureObj;
  };
};
const auth = createMiddleware<TMiddlewareContext>(
  async (c: Context, next: Next) => {
    const prisma = new PrismaClient();
    const token = await getSignedCookie(c, process.env.SECRET, 'signed_key');
    if (token) {
      const session = await prisma.session.findUnique({ where: { token } });
      const key = V4.bytesToKeyObject(Buffer.from(session.key) as Buffer);
      const user = (await V4.verify(token, key)) as TUSignatureObj;
      const isExistingUser = await prisma.user.findUnique({
        where: { id: user.userId },
      });
      if (isExistingUser) {
        c.set('getUser', () => user);
        await next();
      } else {
        c.status(401);
        return c.json({ message: 'Unauthorized user.', status: 401 });
      }
    }
    return c.json({ message: 'Unauthorized user', status: 401 });
  }
);

export default auth;
