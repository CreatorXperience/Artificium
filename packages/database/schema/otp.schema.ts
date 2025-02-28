import z from 'zod';

const otp = z.object({
  otp: z.string().min(6, { message: 'otp length must be six' }),
  userId: z.string(),
  expiresIn: z.number(),
  createdAt: z.string(),
});

type TOtp = z.infer<typeof otp>;

const validateOtp = (payload: z.infer<typeof otp>) => {
  const newOtp = otp
    .partial({ userId: true, expiresIn: true, createdAt: true })
    .required({ otp: true });
  return newOtp.safeParse(payload);
};

export { validateOtp, TOtp };
