import { createMockContext } from '@org/database';
import { PrismaClient } from '@prisma/client';
export const mockedPrisma = createMockContext();
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
