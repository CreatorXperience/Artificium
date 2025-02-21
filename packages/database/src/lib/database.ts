import { authSchemaValidator, TAuth } from '../../schema/auth.schema';
import { MockContext, createMockContext, Context } from '../../context';
// import { prismaMock } from '../../jest.setup';
export function database(): string {
  return 'database';
}

export {
  authSchemaValidator,
  MockContext,
  createMockContext,
  Context,
  TAuth,
  // prismaMock,
};
