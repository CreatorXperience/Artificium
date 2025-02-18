import * as database from '@org/database';
import generatePrivateKey from '../utils/generatePrivateKey';
import { PrismaClient } from '@prisma/client';
import paseto from 'paseto';
import { Context } from 'hono';
import { BlankEnv, BlankInput } from 'hono/types';
import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
} from 'hono/cookie';
import dotenv from 'dotenv';
dotenv.config();
const { V4 } = paseto;
console.log(process.env.SIGNED_KEY);

const prisma = new PrismaClient();

const login = async (c: Context<BlankEnv, '/auth/login', BlankInput>) => {
  const { email, password } = await c.req.json();
  const data = database.authSchemaValidator({ email, password });

  if (data.error) {
    c.status(400);
    return c.json({ status: 400, message: data.error.issues[0].message });
  }

  const key = await generatePrivateKey();
  const user = await prisma.user.create({
    data: {
      email,
      password,
    },
  });

  const public_key = await V4.sign(
    { userId: user.id, exp: Math.floor(Date.now() / 1000) + 3600 },
    key
  );

  await setSignedCookie(
    c,
    'signed_public-key',
    public_key,
    Buffer.from(process.env.SIGNED_KEY),
    { maxAge: 60 * 60, httpOnly: true, path: '/' }
  );

  return c.json({
    status: 200,
    message: 'user login successfully',
    data: { email: user.email },
  });
};

const getToken = async (c: Context<BlankEnv, '/auth/login', BlankInput>) => {
  const token = await getSignedCookie(c, process.env.SIGNED_KEY);
  console.log(token);
  c.json({ token });
};

export { login, getToken };
