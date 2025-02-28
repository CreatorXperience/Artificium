import app from './auth';
import {} from '@org/database';
import hashPassword from '../utils/hashPassword';
import prisma from '../../jest.setup';
const NON_EXISTING_USER_EMAIL = 'non@gmail.com';
const NON_EXISTING_USER_PASS = 'non-securepass';
const PASSWORD = '123456';
let user;

beforeAll(async () => {
  user = {
    email: 'tester@gmail.com',
    password: await hashPassword(PASSWORD),
    firstname: 'Joe',
    lastname: 'frazier',
  };
});

afterEach(async () => {
  await prisma.user.deleteMany();
});

describe('auth/login', () => {
  test('should return a status of 404 if password is invalid', async () => {
    await prisma.user.create({
      data: {
        email: user.email,
        password: user.password,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    });
    const res = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: '1234578' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(res.status).toBe(404);
  });

  test('should return a status of 200 if user exist', async () => {
    await prisma.user.create({ data: { ...user } });

    const res = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        password: PASSWORD,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).not.toBeFalsy();
    expect(res.headers.get('set-cookie')).not.toBeUndefined();
  });

  test('should return 400 if payload is bad', async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'allyearmustobey@gmail.com',
        password: '1234',
      }),
      headers: new Headers({ Content_Type: 'application/json' }),
    });

    expect(res.status).toBe(400);
  });

  test("should return 404 if user doesn't exist", async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: NON_EXISTING_USER_EMAIL,
        password: NON_EXISTING_USER_PASS,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(res.status).toBe(404);
  });

  test('database should include a session private key for a logged in user', async () => {
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        password: user.password,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    });

    let session = await prisma.session.findFirst({
      where: { user: newUser.id },
    });
    expect(session).toBeNull();

    const loggedInuser = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: PASSWORD }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    const userData = await loggedInuser.json();
    session = await prisma.session.findFirst({
      where: { user: userData.data.id },
    });
    expect(session).not.toBeNull();
  });
});

describe('/auth/signup', () => {
  const incompletePayload = {
    email: 'tester@gmail.com',
    password: PASSWORD,
    firstname: 'Joe',
  };
  test('should return 400 error if payload is bad or incomplete', async () => {
    const res = await app.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(incompletePayload),
    });

    expect(res.status).toBe(400);
  });

  test('should return a 400 error if user already exist', async () => {
    const completePayload = { ...incompletePayload, lastname: 'Frazier' };
    await prisma.user.create({
      data: {
        ...completePayload,
      },
    });
    const res = await app.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(completePayload),
    });

    expect(res.status).toBe(400);
  });

  test('should return a 200 success status code if user is a new not-existing user', async () => {
    const newUser = {
      email: 'newuser@gmail.com',
      password: 'newuser0123',
      firstname: 'Muhammad',
      lastname: 'Ali',
    };
    const res = await app.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });

    expect(res.status).toBe(200);
  });
});
