import z from 'zod';

const gmailIntegration = z.object({
  code: z.string({ message: 'property code is required' }),
});

type TGmailIntegration = Required<z.infer<typeof gmailIntegration>>;

const validateGmailIntegrationPayload = (payload: TGmailIntegration) => {
  return gmailIntegration.required({ code: true }).safeParse(payload);
};

export { validateGmailIntegrationPayload };
