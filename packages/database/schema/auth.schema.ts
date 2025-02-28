import z from 'zod';

const user = z.object({
  email: z.string({ message: 'email is required' }),
  password: z.string().min(6, { message: 'password not long enough' }),
  firstname: z.string({ message: 'firstname is required' }),
  lastname: z.string({ message: 'lastname is required' }),
});

type TAuth = Required<z.infer<typeof user>>;

const loginSchemaValidator = (userPayload: Partial<TAuth>) => {
  const reqUser = user
    .partial({ firstname: true, lastname: true })
    .required({ email: true, password: true });
  return reqUser.safeParse(userPayload);
};

const signupSchemaValidator = (userPayload: TAuth) => {
  user.required();

  return user.safeParse(userPayload);
};

export { loginSchemaValidator, signupSchemaValidator, TAuth };
