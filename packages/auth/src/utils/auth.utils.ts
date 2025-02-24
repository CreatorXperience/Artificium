import { TAuth } from '@org/database';
import { PrismaClient } from '@prisma/client';

const findUser = async (user: Partial<TAuth>, prisma: PrismaClient) => {
  const existing_user = await prisma.user.findUnique({
    where: { email: user.email },
  });
  return existing_user;
};

export { findUser };
