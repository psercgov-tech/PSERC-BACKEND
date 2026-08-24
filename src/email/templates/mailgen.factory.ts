import Mailgen = require('mailgen');

/**
 * Fresh Mailgen instance so FRONTEND_URL / EMAIL_LOGO_URL are read from current env.
 */
export function getMailgen(): Mailgen {
  const logoUrl = process.env.EMAIL_LOGO_URL?.trim();
  return new Mailgen({
    theme: 'default',
    product: {
      name: 'PSERC Portal',
      link: process.env.FRONTEND_URL || 'https://pserc.vercel.app',
      ...(logoUrl ? { logo: logoUrl, logoHeight: '120px' } : {}),
      copyright: 'Plateau State Electricity Regulatory Commission',
    },
  });
}
