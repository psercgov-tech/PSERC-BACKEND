export type PortalJwtPayload = {
  sub: string;
  email: string;
  role: 'portal';
  name: string;
  sid: string;
  fp: string;
};
