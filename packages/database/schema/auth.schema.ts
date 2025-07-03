import z from 'zod';

const user = z.object({
  email: z.string({ message: 'email is required' }).email({ message: "must be a valid email" }),
  password: z
    .string({ message: 'password is required' })
    .min(6, { message: 'password not long enough' }),
  firstname: z.string({ message: 'firstname is required' }),
  lastname: z.string({ message: 'lastname is required' }),
});

const resetPassPayload = z.object({
  email: z.string({ message: 'email is required and must be a string' }).email({ message: "must be a valid email" }),
  token: z.string({ message: 'invalid token' }),
  password: z
    .string({ message: 'password is required' })
    .min(6, { message: 'password not long enough' }),
});

type TResetPassPayload = z.infer<typeof resetPassPayload>;

type TAuth = Required<z.infer<typeof user>>;

const loginSchemaValidator = (userPayload: Partial<TAuth>) => {
  const reqUser = user
    .omit({ firstname: true, lastname: true })
    .required({ email: true, password: true });
  return reqUser.safeParse(userPayload);
};

const signupSchemaValidator = (userPayload: TAuth) => {
  return user.required().safeParse(userPayload);
};

const forgotPasswordValidator = (userPayload: Partial<TAuth>) => {
  const forgotPassUser = user
    .omit({ firstname: true, lastname: true, password: true })
    .required({ email: true });

  return forgotPassUser.safeParse(userPayload);
};

const resetPassValidator = (payload: TResetPassPayload) => {
  return resetPassPayload.required().safeParse(payload);
};

export {
  loginSchemaValidator,
  signupSchemaValidator,
  TAuth,
  forgotPasswordValidator,
  resetPassValidator,
  user
};
