import z from 'zod';

const user = z.object({
  email: z.string(),
  password: z.string().min(6, { message: 'password not long enough' }),
});

type TAuth = z.infer<typeof user>;

const authSchemaValidator = (userPayload: TAuth) => {
  user.required();
  return user.safeParse(userPayload);
};

export { authSchemaValidator, TAuth };
