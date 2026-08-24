import { getMailgen } from './mailgen.factory';

const RESET_CODE_MINUTES = 15;

/**
 * Forgot password — email contains a 6-digit code the user enters on the reset page.
 */
export function buildPasswordResetEmail(
  name: string,
  code: string,
  email: string,
) {
  const mailgen = getMailgen();
  const baseUrl = (
    process.env.FRONTEND_URL || 'https://pserc.vercel.app'
  ).replace(/\/$/, '');
  const q = new URLSearchParams({ email: email.trim().toLowerCase() });
  const resetPage = `${baseUrl}/#/portal/reset-password?${q.toString()}`;

  const emailBody = {
    body: {
      name,
      intro: [
        'We received a request to reset the password for your PSERC Portal account.',
        `Your reset code is: ${code}`,
        `This code expires in ${RESET_CODE_MINUTES} minutes.`,
      ],
      action: {
        instructions:
          'Open the reset page and enter this code with your new password.',
        button: {
          color: '#025830',
          text: 'Reset password',
          link: resetPage,
        },
      },
      outro:
        'If you did not request a password reset, you can ignore this email — your password will stay the same.',
    },
  };

  return {
    subject: 'PSERC Portal — Your password reset code',
    html: mailgen.generate(emailBody),
    text: mailgen.generatePlaintext(emailBody),
  };
}

export { RESET_CODE_MINUTES };
