import z from 'zod';
const invite = z.object({
  projectId: z.string({ message: 'property projectId is required' }),
  role: z.enum(['editor', 'viewer']),
});

type TInvite = Required<z.infer<typeof invite>>;

const validateInvitePayload = (payload: TInvite) => {
  return invite.required().safeParse(payload);
};

export { validateInvitePayload, TInvite };
