import {
  loginSchemaValidator,
  signupSchemaValidator,
  TAuth,
} from '../../schema/auth.schema';
// import { prismaMock } from '../../jest.setup';
export function database(): string {
  return 'database';
}

export {
  loginSchemaValidator,
  signupSchemaValidator,
  TAuth,
  // prismaMock,
};
