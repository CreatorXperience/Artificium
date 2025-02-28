import { PrismaClient } from '@prisma/client';
const getPrisma = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      prisma: '',
    };
  }
  return {
    prisma: new PrismaClient(),
  };
};
export { getPrisma };
