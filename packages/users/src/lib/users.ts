import { Hono } from 'hono';

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { authMiddleWare } from '@org/auth';
import { PrismaClient } from '@prisma/client';

const app = new Hono().basePath('/user');
const prisma = new PrismaClient();
app.post('/profile/upload', authMiddleWare, async (c) => {
  const user = c.var.getUser().id;
  const body = await c.req.parseBody({ dot: true });
  const file = body['image'] as File;

  console.log(file.size / 1024);
  const max_size = 5 * 1024 * 1024;

  if (!file) {
    return c.json({ message: 'no file uploaded' });
  }

  if (file.size > max_size) {
    return c.json({ message: 'file is larger than 5mb' });
  }

  const imageBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  cloudinary.config({
    cloud_name: 'dtah4aund',
    api_key: '232487372395222',
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
  });
  const uploadResult = (await cloudinary.uploader
    .upload(dataUri, {
      public_id: 'profile',
    })
    .catch((error) => {
      console.log(error);
    })) as UploadApiResponse;

  await prisma.user.update({
    where: { id: user },
    data: { image: uploadResult.secure_url },
  });

  return c.json({ message: 'message uploaded successfully' });
});

export default app;
