import { PrismaClient } from '@prisma/client';
import {
  loginSchemaValidator,
  signupSchemaValidator,
  TAuth,
} from '../../schema/auth.schema';
import { validateOtp, TOtp } from '../../schema/otp.schema';
import { validateSession, TSession } from '../../schema/session.schema';

const prisma = new PrismaClient();
export function database(): string {
  return 'database';
}

export async function create<T>(payload: T, model: string) {
  const data = await prisma[model].create({
    data: payload,
  });
  return data;
}

export {
  loginSchemaValidator,
  signupSchemaValidator,
  TAuth,
  validateOtp,
  TOtp,
  validateSession,
  TSession,
  // prismaMock,
};
