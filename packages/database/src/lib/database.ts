import { PrismaClient } from '@prisma/client';
import {
  loginSchemaValidator,
  signupSchemaValidator,
  TAuth,
} from '../../schema/auth.schema';
import { validateOtp, TOtp } from '../../schema/otp.schema';
// import { prismaMock } from '../../jest.setup';
const prisma = new PrismaClient();
export function database(): string {
  return 'database';
}

export async function create<T>(payload: T, type: string) {
  const data = await prisma[type].create({
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
  // prismaMock,
};
