import { PrismaClient } from '@prisma/client';
import {
  loginSchemaValidator,
  signupSchemaValidator,
  forgotPasswordValidator,
  TAuth,
  resetPassValidator,
} from '../../schema/auth.schema';
import { validateOtp, TOtp } from '../../schema/otp.schema';
import {
  workspaceValidator,
  TCreateWorkspace,
  updateWorkspaceValidator,
  TWorkspace,
} from '../../schema/workspace.schema';
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
  forgotPasswordValidator,
  resetPassValidator,
  workspaceValidator,
  TCreateWorkspace,
  updateWorkspaceValidator,
  TWorkspace,
};
