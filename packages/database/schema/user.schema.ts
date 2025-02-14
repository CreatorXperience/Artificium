import z from 'zod';

const user = z.object({
  email: z.string(),
  password: z.string().min(6, { message: 'password not long enough' }),
});

const userValidator = (userPayload: z.infer<typeof user>) => {
  user.required();
  return user.safeParse(userPayload);
};

export default userValidator;
