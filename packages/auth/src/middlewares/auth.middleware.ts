import { Context, Next } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { V4 } from 'paseto';

const auth = createMiddleware(async (c: Context, next: Next) => {
  const token = await getSignedCookie(c, process.env.SECRET, 'signed_key');
  if (token) {
    const key = await V4.generateKey('public');
    const id = await V4.verify(token, key);
    console.log(id);
  }

  if (token) {
    await next();
  } else {
    c.status(401);
    return c.json({ message: 'Unauthorized user.', status: 401 });
  }
});

export default auth;
