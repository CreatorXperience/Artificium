import { auth } from '@org/auth';
import { PrismaClient } from '@prisma/client';
import app from '../lib/users';
import { v2 as cloudinary } from 'cloudinary';
const prisma = new PrismaClient();

jest.mock('cloudinary', () => ({
  ...jest.requireActual('cloudinary'),
  v2: {
    config: jest.fn().mockResolvedValue(undefined),
    api: {
      resource: jest.fn().mockResolvedValue({ public_id: '' }),
    },
    uploader: {
      destroy: jest.fn().mockResolvedValue(null),
      upload: jest.fn().mockResolvedValue({
        public_id: 'test_id',
        secure_url: 'http://secure_cloudinary.com/test.jpg',
      }),
    },
  },
}));
describe('users', () => {
  let user;
  let userData;
  beforeAll(async () => {
    await auth.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'allyearmustobey@gmail.com',
        password: '123456',
        firstname: 'tester',
        lastname: 'peter',
      }),
    });
    user = await auth.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'allyearmustobey@gmail.com',
        password: '123456',
      }),
      headers: new Headers({ Content_Type: 'application/json' }),
    });

    userData = await user.json();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.$disconnect();
    jest.clearAllMocks();
  });
  describe('POST /user/profile/upload', () => {
    test('should return 400 if file is not found', async () => {
      const res = await app.request('/user/profile/upload', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          Cookie: user.headers.get('set-cookie'),
        },
      });
      expect(cloudinary.config).toHaveBeenCalled();
      expect(cloudinary.api.resource).not.toHaveBeenCalled();
      expect(res.status).toBe(400);
    });

    test('should return 400 if file size is larget than 5mb', async () => {
      const form = new FormData();
      const bytes = 10 * 1024 * 1024;
      const content = 'a'.repeat(bytes);
      const blob = new Blob([content], { type: 'text/plain' });

      const file = new File([blob], 'filename.txt', { type: 'text/plain' });
      form.append('image', file);
      const res = await app.request('/user/profile/upload', {
        method: 'POST',
        body: form,
        headers: {
          Cookie: user.headers.get('set-cookie'),
        },
      });
      console.log(await res.json());
      // expect(cloudinary.config).toHaveBeenCalled();
      // expect(cloudinary.api.resource).toHaveBeenCalled();
      // expect(cloudinary.api.resource).toHaveReturned();
      // expect(cloudinary.uploader.destroy).toHaveBeenCalled();
      // expect(cloudinary.uploader.upload).toHaveBeenCalled();
      expect(res.status).toBe(400);
    });
    test('should return 200 if file size is within 5mb', async () => {
      const form = new FormData();
      const bytes = 4 * 1024 * 1024;
      const content = 'a'.repeat(bytes);
      const blob = new Blob([content], { type: 'text/plain' });

      const file = new File([blob], 'filename.txt', { type: 'text/plain' });
      form.append('image', file);
      const res = await app.request('/user/profile/upload', {
        method: 'POST',
        body: form,
        headers: {
          Cookie: user.headers.get('set-cookie'),
        },
      });
      expect(cloudinary.config).toHaveBeenCalled();
      expect(cloudinary.api.resource).toHaveBeenCalled();
      expect(cloudinary.api.resource).toHaveReturned();
      expect(cloudinary.uploader.destroy).toHaveBeenCalled();
      expect(cloudinary.uploader.upload).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });
  });
});
