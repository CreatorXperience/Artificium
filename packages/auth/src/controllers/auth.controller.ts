import * as database from '@org/database';
import generatePrivateKey from '../utils/generatePrivateKey';
import paseto from 'paseto';
import { Context } from 'hono';
import { BlankEnv, BlankInput } from 'hono/types';
import { deleteCookie, setSignedCookie } from 'hono/cookie';
import dotenv from 'dotenv';
import { findUser } from '../utils/auth.utils';
import { PrismaClient } from '@prisma/client';
dotenv.config();
const { V4 } = paseto;
const prisma = new PrismaClient();
const login = async (c: Context<BlankEnv, '/auth/login', BlankInput>) => {
  const { email, password } = await c.req.json();
  const data = database.authSchemaValidator({ email, password });

  if (data.error) {
    c.status(400);
    return c.json({ status: 400, message: data.error.issues[0].message });
  }

  const user = await findUser({ email, password }, prisma);
  if (!user) {
    c.status(404);
    return c.json({ status: 404, message: "user doesn't exist" });
  }

  const key = await generatePrivateKey();
  const public_key = await V4.sign({ userId: user.id }, key);

  await setSignedCookie(c, 'signed_key', public_key, process.env.SECRET, {
    maxAge: 60 * 60,
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
  });

  return c.json({
    status: 200,
    message: 'user login successfully',
    data: { email: user.email },
  });
};

const logout = async (c: Context<BlankEnv, '/auth/login', BlankInput>) => {
  deleteCookie(c, 'signed_key');
  return c.json({ messaage: 'cookie removed successfully', status: 200 });
};

export { login, logout };
