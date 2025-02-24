import z from 'zod';

const user = z.object({
  email: z.string(),
  password: z.string().min(6, { message: 'password not long enough' }),
  firstname: z.string(),
  lastname: z.string(),
});

type TAuth = z.infer<typeof user>;

const loginSchemaValidator = (userPayload: TAuth) => {
  user.required({ email: true, password: true });
  return user.safeParse(userPayload);
};

const signupSchemaValidator = (userPayload: TAuth) => {
  user.required({
    email: true,
    password: true,
    firstname: true,
    lastname: true,
  });

  return user.safeParse(userPayload);
};

export { loginSchemaValidator, signupSchemaValidator, TAuth };
