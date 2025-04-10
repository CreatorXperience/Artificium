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
import {
  projectValidator,
  TProject,
  projectUpdateValidator,
} from '../../schema/project.schema';

import {
  TChannel,
  channelValidator,
  channelUpdateValidator,
} from '../../schema/channel.schema';

import {
  TChannelReq,
  channelReqValidator,
} from '../../schema/channelReq.shema';

import { acceptOrRejectReqValidator } from '../../schema/acceptOrRejReq.schema';
import isHex from '../../utils/isHex';
import {
  artificiumMessagePayloadValidator,
  updateArtificiumMessagePayloadSchema,
} from '../../schema/artificiumMessage.schema';
import Redis from '../../redis/redis';
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
  projectValidator,
  TProject,
  projectUpdateValidator,
  TChannel,
  channelValidator,
  channelUpdateValidator,
  TChannelReq,
  channelReqValidator,
  acceptOrRejectReqValidator,
  isHex,
  artificiumMessagePayloadValidator,
  Redis,
  updateArtificiumMessagePayloadSchema,
};
