import app from './auth';
import {} from '@org/database';
import hashPassword from '../utils/hashPassword';
const EXISTING_USER_EMAIL = 'tester2@gmail.com';
let EXISTING_USER_PASS = '123456';
const NON_EXISTING_USER_EMAIL = 'newuser@gmail.com';
const NON_EXISTING_USER_PASS = '123456';
import prisma from '../../jest.setup';

beforeEach(async () => {
  EXISTING_USER_PASS = await hashPassword(EXISTING_USER_PASS);
});

describe('auth/login', () => {
  test("should return a status of 404  if user doesn't exist", async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'peter@gmail.com', password: '123456' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(res.status).toBe(404);
  });

  test('should return a status of 200 if user exist', async () => {
    const user = {
      email: EXISTING_USER_EMAIL,
      password: EXISTING_USER_PASS,
      firstname: 'Joe',
      lastname: 'frazier',
    };

    await app.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(user),
    });

    const res = await app.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: EXISTING_USER_EMAIL,
        password: EXISTING_USER_PASS,
      }),
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
});

describe('/auth/signup', () => {
  const incompletePayload = {
    email: 'tester@gmail.com',
    password: '123456',
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
