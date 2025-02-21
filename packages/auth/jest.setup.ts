import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env.test' });
const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.PRISMA_SCHEMA = '../database/prisma/tests';

  await prisma.$connect();
});

afterAll(async () => {
  console.info('Suite Test ended successfully, database clean up');
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

export default prisma;
