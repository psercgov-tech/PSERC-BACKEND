import { getMailgen } from './mailgen.factory';

/** Sent after successful password reset (security notice). */
export function buildPasswordChangedEmail(name: string) {
  const mailgen = getMailgen();
  const email = {
    body: {
      name,
      intro: [
        'Your PSERC Portal password was changed successfully.',
        'If you made this change, no further action is needed.',
        'If you did not change your password, contact PSERC immediately and secure your account.',
      ],
      outro: 'Stay safe. Never share your password with anyone.',
    },
  };

  return {
    subject: 'PSERC Portal: Your password was changed',
    html: mailgen.generate(email),
    text: mailgen.generatePlaintext(email),
  };
}
