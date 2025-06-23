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
  projectMemberValidator,
  projectRoleValidator,
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
  deleteArtificiumMessageValidator,
  artificiumValidator,
} from '../../schema/artificiumMessage.schema';

import { TInvite, validateInvitePayload } from '../../schema/invite.schema';
import { validateSlackConfigPayload, validateSlackMsgPayload } from "../../schema/slack-message.schema"
import usernameUpdateValidator from '../../schema/user.schema';
import Redis from '../../redis/redis';
import * as integration from '../../schema/integration.schema';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

const cloudinary_config = cloudinary.config({
  cloud_name: 'dtah4aund',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

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
  deleteArtificiumMessageValidator,
  integration,
  usernameUpdateValidator,
  projectMemberValidator,
  projectRoleValidator,
  artificiumValidator,
  TInvite,
  validateInvitePayload,
  cloudinary_config,
  cloudinary,
  validateSlackMsgPayload,
  validateSlackConfigPayload
};
