import { getMailgen } from './mailgen.factory';

/**
 * Forgot password — link includes user id + opaque `reset` (stored as `resetUrlToken`).
 * Uses hash-router path for the Vite SPA: /#/portal/reset-password?uid=&reset=
 */
export function buildPasswordResetEmail(
  name: string,
  userId: string,
  resetUrlToken: string,
) {
  const mailgen = getMailgen();
  const baseUrl = (
    process.env.FRONTEND_URL || 'https://pserc.vercel.app'
  ).replace(/\/$/, '');
  const q = new URLSearchParams({
    uid: userId,
    reset: resetUrlToken,
  });
  const resetLink = `${baseUrl}/#/portal/reset-password?${q.toString()}`;

  const email = {
    body: {
      name,
      intro: [
        'We received a request to reset the password for your PSERC Portal account.',
        'This link is valid for 1 hour and is unique to your account.',
      ],
      action: {
        instructions: 'Click the button below to choose a new password.',
        button: {
          color: '#025830',
          text: 'Reset password',
          link: resetLink,
        },
      },
      outro: `If the button does not work, copy and paste this link into your browser:\n${resetLink}`,
    },
  };

  return {
    subject: 'PSERC Portal — Reset your password',
    html: mailgen.generate(email),
    text: mailgen.generatePlaintext(email),
  };
}
