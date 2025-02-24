import z from 'zod';

const otp = z.object({
  id: z.string(),
  userId: z.string(),
  otp: z.string(),
  expiresIn: z.number(),
  createdAt: z.string(),
});

type TOtp = z.infer<typeof otp>;

const validateOtp = (payload: z.infer<typeof otp>) => {
  otp.required();
  return otp.safeParse(payload);
};

export { validateOtp, TOtp };
