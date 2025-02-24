import z from 'zod';
const session = z.object({
  id: z.string(),
  key: z.any(),
  user: z.string(),
  token: z.string(),
});

type TSession = Required<z.infer<typeof session>>;

const validateSession = (sessionPayload: TSession) => {
  const partialSession = session.partial({ id: true }).required();
  return partialSession.safeParse(sessionPayload);
};

export { validateSession, TSession };
