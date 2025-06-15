import { PrismaClient } from '@prisma/client';
import { usernameUpdateValidator, cloudinary } from '@org/database';

import { Context } from 'hono';
import { UploadApiResponse } from 'cloudinary';
const prisma = new PrismaClient();
const uploadProfile = async (c: Context) => {
  const userId = c.var.getUser().id;

  const body = await c.req.parseBody({ dot: true });
  const file = body['image'] as File;

  const max_size = 5 * 1024 * 1024;

  if (!file) {
    return c.json({ message: 'no file uploaded' }, 400);
  }

  const result = await cloudinary.api.resource(userId);
  if (result) {
    await cloudinary.uploader.destroy(
      userId,
      { resource_type: 'image' },
      (err, _) => {
        if (err) {
          return c.json(
            { message: 'an error occured while updating profile picture' },
            404
          );
        }
      }
    );
  }

  if (file.size > max_size) {
    return c.json({ message: 'file is larger than 5mb' });
  }

  const imageBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  const uploadResult = (await cloudinary.uploader
    .upload(dataUri, {
      public_id: `${userId}`,
      folder: 'profile',
    })
    .catch((error) => {
      console.log(error);
    })) as UploadApiResponse;

  await prisma.user.update({
    where: { id: userId },
    data: { image: uploadResult.secure_url },
  });

  return c.json({ message: 'message uploaded successfully' });
};

const createOrEditUsername = async (c: Context) => {
  const user_id = c.var.getUser().id;
  const body = await c.req.json();
  const { error, data } = usernameUpdateValidator(body);
  if (error) {
    return c.json({ message: `Validation Error: ${error.errors[0].message}` });
  }

  await prisma.user.update({
    where: { id: user_id },
    data: { username: '@' + data.username },
  });

  return c.json({ message: 'username updated successfully' });
};

const getLoginUser = async (c: Context) => {
  const user = c.var.getUser();

  return c.json({ message: 'user retrieved successfully', data: user });
};

export { uploadProfile, createOrEditUsername, getLoginUser };
