import { Context, Next } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

const auth = createMiddleware(async (c: Context, next: Next) => {
  const signed_key = await getSignedCookie(c, process.env.SECRET, 'signed_key');
  if (signed_key) {
    await next();
  } else {
    c.status(401);
    return c.json({ message: 'Unauthorized user.', status: 401 });
  }
});

export default auth;
