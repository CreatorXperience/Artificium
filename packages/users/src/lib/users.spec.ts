import { auth } from '@org/auth';
import { PrismaClient } from '@prisma/client';
import app from '../lib/users';

const prisma = new PrismaClient();
const form = new FormData();
const blob = new Blob(['Hello world'], { type: 'text/plain' });
const file = new File([blob], 'greetings.jpg', { type: 'text/plain' });
form.append('image', file);

const uploadMock = jest.fn().mockResolvedValue({
  public_id: 'test_id',
  secure_url: 'http://secure_cloudinary.com/test.jpg',
});
jest.mock('cloudinary', () => ({
  ...jest.requireActual('cloudinary'),
  v2: {
    uploader: {
      upload: uploadMock,
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
  });
  describe('POST /user/profile/upload', () => {
    test('should return 400 if file is not found', async () => {
      const res = await app.request('/user/profile/upload', {
        method: 'POST',
        body: form,
        headers: {
          Cookie: user.headers.get('set-cookie'),
        },
      });
    });
  });
});
