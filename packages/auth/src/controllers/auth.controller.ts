import * as database from '@org/database';
import generatePrivateKey from '../utils/generatePrivateKey';
import paseto from 'paseto';
import { Context } from 'hono';
import { BlankEnv, BlankInput } from 'hono/types';
import { deleteCookie, setSignedCookie } from 'hono/cookie';
import dotenv from 'dotenv';
import { findUser } from '../utils/auth.utils';
import { PrismaClient } from '@prisma/client';
import _ from 'lodash';
dotenv.config();
const { V4 } = paseto;
const prisma = new PrismaClient();

const login = async (c: Context<BlankEnv, '/auth/login', BlankInput>) => {
  const { email, password } = await c.req.json();
  const data = database.loginSchemaValidator({ email, password });

  if (data.error) {
    c.status(400);
    return c.json({
      status: 400,
      message: data.error,
    });
  }

  const user = await findUser({ email, password }, prisma);
  if (!user) {
    c.status(404);
    return c.json({ status: 404, message: "user doesn't exist" });
  }

  const key = await generatePrivateKey();
  const keyBytes = V4.keyObjectToBytes(key);
  // await prisma.sess

  const session = await prisma.session.findUnique({ where: { user: user.id } });
  if (session) {
    await prisma.session.delete({ where: { id: session.id } });
  }
  const public_key = await V4.sign({ userId: user.id }, key);

  await database.create<Omit<database.TSession, 'id'>>(
    { key: keyBytes, user: user.id, token: public_key },
    'session'
  );

  await setSignedCookie(c, 'signed_key', public_key, process.env.SECRET, {
    maxAge: 60 * 60,
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
  });

  return c.json({
    status: 200,
    message: 'user login successfully',
    data: _.omit(user, ['password']),
  });
};

const logout = async (c: Context<BlankEnv, '/auth/login', BlankInput>) => {
  deleteCookie(c, 'signed_key');
  return c.json({ messaage: 'cookie removed successfully', status: 200 });
};

const signup = async (c: Context<BlankEnv, '/auth/signup', BlankInput>) => {
  const userPayload: database.TAuth = await c.req.json();

  const data = database.signupSchemaValidator(userPayload);

  if (data.error) {
    c.status(400);
    return c.json({
      message: data.error,
      status: 400,
    });
  }

  const existingUser = await findUser(userPayload, prisma);
  if (existingUser) {
    c.status(400);
    return c.json({ message: 'user already exists', status: 400 });
  }
  const user = await database.create<database.TAuth>(
    {
      ...userPayload,
    },
    'user'
  );

  c.status(200);
  return c.json({
    message: 'user created successfully',
    data: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      isVerified: user.isVerified,
    },
    status: 200,
  });
};

const sendOtp = async (c: Context) => {
  const id = c.var.getUser().userId;
  const otp = Math.floor(Math.random() * 999999).toString();

  const existingUserOtp = await prisma.otp.findUnique({
    where: { userId: id },
  });
  if (existingUserOtp) {
    await prisma.otp.deleteMany({ where: { userId: id } });
  }

  const newOtp = await database.create<database.TOtp>(
    {
      otp: otp,
      createdAt: new Date().toISOString(),
      expiresIn: 50000,
      userId: id,
    },
    'otp'
  );

  if (newOtp) {
    c.status(200);
    return c.json({ message: 'otp created successfully', data: newOtp });
  }
};

const verifyOtp = async (c: Context) => {
  const otpPayload: Omit<
    Required<database.TOtp>,
    'id' | 'userId' | 'expiresIn' | 'createdAt'
  > = await c.req.json();
  const userId = c.var.getUser().userId;
  const data = database.validateOtp(otpPayload);
  if (data.error) {
    c.status(400);
    return c.json({
      message: data.error.errors.map((err) => err.path[0] + ' ' + err.message),
    });
  }

  const otp = await prisma.otp.findUnique({ where: { userId: userId } });
  if (!otp) {
    c.status(404);
    return c.json({ status: 404, message: 'Invalid otp' });
  }

  // check expiry

  const currentDate = new Date();
  const otpGenDate = new Date(otp.createdAt);

  if (currentDate.getDate() !== otpGenDate.getDate()) {
    await prisma.otp.deleteMany({ where: { userId: userId } });
    console.log('1');
    return c.json({ message: 'otp expired' });
  }
  if (currentDate.getHours() !== otpGenDate.getHours()) {
    await prisma.otp.deleteMany({ where: { userId: userId } });
    console.log('2');
    return c.json({ message: 'otp expired' });
  }
  if (currentDate.getMinutes() - otpGenDate.getMinutes() < 5) {
    const otp = await prisma.otp.findFirst({
      where: { otp: otpPayload.otp, userId },
    });
    if (!otp) {
      c.status(404);
      return c.json({ message: 'Incorrect or Malformed otp ', status: 404 });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const newUser = { ...user, isVerified: true };
      await prisma.user.update({
        data: _.omit(newUser, ['id']),
        where: { id: userId },
      });
      c.status(200);
      await prisma.otp.deleteMany({ where: { userId: userId } });
      return c.json({ message: 'otp verified successfully', user: newUser });
    }
  } else {
    await prisma.otp.deleteMany({ where: { userId: userId } });
    console.log('3');
    return c.json({ message: 'otp expired' });
  }
};
export { login, logout, signup, sendOtp, verifyOtp };
