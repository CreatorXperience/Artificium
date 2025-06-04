import { z } from 'zod';

const usernameUpdateSchema = z.object({
  username: z.string({ message: 'property username is required' }),
});

type TPayload = Required<z.infer<typeof usernameUpdateSchema>>;
const usernameUpdateValidator = (payload: TPayload) => {
  return usernameUpdateSchema.safeParse(payload);
};

export default usernameUpdateValidator;
