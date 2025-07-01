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
import hashPassword from '../utils/hashPassword';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { SafeParseReturnType } from 'zod';
dotenv.config();
const { V4 } = paseto;
const prisma = new PrismaClient();

type TReq = {
  email: string;
  password: string;
};
const login = async (c: Context<BlankEnv, '/auth/login', BlankInput>) => {
  const req: TReq = await c.req.json();
  const data = database.loginSchemaValidator(req);

  if (data.error) {
    c.status(400);
    console.log(data.error.errors[0].message)
    return c.json({
      status: 400,
      message: data.error.errors[0].message,
    });
  }

  const user = await findUser({ email: req.email }, prisma);
  if (!user) {
    c.status(404);
    return c.json({ status: 404, message: "user doesn't exist" });
  }

  const matched = await bcrypt.compare(req.password, user.password);
  if (!matched) {
    c.status(404);
    return c.json({ messages: 'Invalid email or password', status: 404 });
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
  return c.json({ messaage: 'cookie removed successfully' });
};

const signup = async (c: Context<BlankEnv, '/auth/signup', BlankInput>) => {
  const userPayload: database.TAuth = await c.req.json();

  const data = database.signupSchemaValidator(
    userPayload
  ) as SafeParseReturnType<database.TAuth, database.TAuth>;

  if (data.error) {
    c.status(400);
    return c.json({
      message: data.error.errors[0].message,
      status: 400,
    });
  }

  const existingUser = await findUser(userPayload, prisma);
  if (existingUser) {
    c.status(400);
    return c.json({ message: 'user already exists', status: 400 });
  }

  const hashedPassword = await hashPassword(userPayload.password);
  const user = await database.create<database.TAuth>(
    {
      ...data.data,
      password: hashedPassword,
    },
    'user'
  );

  c.status(200);
  return c.json({
    message: 'user created successfully',
    data: _.omit(user, ['password']),
    status: 200,
  });
};

const sendOtp = async (c: Context) => {
  const id = c.var.getUser().id;
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
  const user = c.var.getUser()
  const userId = user.id
  const data = database.validateOtp(otpPayload);
  if (data.error) {
    c.status(400);
    return c.json({
      message: data.error.errors[0].message,
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
    c.status(404);
    return c.json({ message: 'otp expired' });
  }
  if (currentDate.getHours() !== otpGenDate.getHours()) {
    await prisma.otp.deleteMany({ where: { userId: userId } });
    c.status(404);
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


    if (user) {
      const user = await prisma.user.update({
        data: { isVerified: true },
        where: { id: userId },
      });
      c.status(200);
      await prisma.otp.deleteMany({ where: { userId: userId } });
      return c.json({ message: 'otp verified successfully', user: _.omit(user, "password") });
    }
  } else {
    await prisma.otp.deleteMany({ where: { userId: userId } });
    return c.json({ message: 'otp expired' });
  }
};

const forgotPassword = async (c: Context) => {
  const body = await c.req.json();
  const data = database.forgotPasswordValidator(body);
  if (data.error) {
    c.status(400);
    return c.json({ messages: data.error.errors[0].message, status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: data.data.email },
  });
  if (!user) {
    c.status(404);
    return c.json({ message: 'user not found', status: 404 });
  }

  await prisma.forgot.deleteMany({ where: { userId: user.id } });
  const hash = createHash('sha256');

  hash.update(user.id);

  const hashed = hash.digest('hex');

  const ttl = Math.floor(Date.now());

  await prisma.forgot.create({
    data: {
      hash: hashed,
      userId: user.id,
      email: user.email,
      ttl: `${ttl}`,
    },
  });



  return c.json({
    message: 'forgotten password successfully, check your email',
    status: 200,
    token: hashed,
    email: user.email,
  });
};

const resetPassword = async (c: Context) => {
  const payload = await c.req.json();
  const data = database.resetPassValidator(payload);

  if (data.error) {
    c.status(400);
    return c.json({ message: data.error.errors[0].message });
  }

  const forgot = await prisma.forgot.findFirst({
    where: { email: payload.email },
  });
  if (!forgot) {
    return c.json({
      message: " forgot session expired"
    }, 404)
  }
  const currentTime = Math.floor(Date.now());

  const ONE_HOUR = 60 * 60 * 1000;

  const convertTTLtoNum = +forgot.ttl;

  const remainingTime = currentTime - convertTTLtoNum;

  if (remainingTime > ONE_HOUR) {
    c.status(404);
    return c.json({
      message: 'forgot password token expired try again',
    });
  }

  if (!(forgot.hash === payload.token)) {
    c.status(400);
    return c.json({ message: 'bad token, try again', });
  }

  const salt = await bcrypt.genSalt(10);

  const hash = await bcrypt.hash(payload.password, salt);

  const user = await prisma.user.update({
    where: { email: payload.email },
    data: { password: hash },
  });

  await prisma.forgot.delete({
    where: { id: forgot.id, email: forgot.email }
  })

  return c.json({
    message: 'password updated successfully',
    data: _.omit(user, ['password']),
  });
};
export {
  login,
  logout,
  signup,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
};
