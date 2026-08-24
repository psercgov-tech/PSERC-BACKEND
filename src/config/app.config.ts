import { registerAs } from '@nestjs/config';

const isProd = process.env.NODE_ENV === 'production';

const DEFAULT_JWT_SECRET = 'pserc-dev-access-secret-change-me';
const MIN_JWT_SECRET_LENGTH = 32;

function jwtSecret() {
  const secret = process.env.JWT_ACCESS_SECRET ?? DEFAULT_JWT_SECRET;
  const isDefault = secret === DEFAULT_JWT_SECRET;
  const tooShort = secret.length < MIN_JWT_SECRET_LENGTH;
  if (isProd && (!process.env.JWT_ACCESS_SECRET || isDefault || tooShort)) {
    throw new Error(
      'JWT_ACCESS_SECRET must be set to a strong unique value in production (at least 32 characters).',
    );
  }
  return secret;
}

function extraOrigins() {
  return (process.env.FRONTEND_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/pserc',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  frontendOrigins: extraOrigins(),
  enableSwagger:
    process.env.ENABLE_SWAGGER === 'true' ||
    (!isProd && process.env.ENABLE_SWAGGER !== 'false'),
  jwt: {
    accessSecret: jwtSecret(),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '4h',
  },
  cookie: {
    secure:
      process.env.COOKIE_SECURE === 'true' ||
      (isProd && process.env.COOKIE_SECURE !== 'false'),
    sameSite:
      (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict') ||
      (isProd ? 'none' : 'lax'),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? 'pserc',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@pserc.ng',
    password: process.env.ADMIN_PASSWORD ?? 'Admin@123456',
    name: process.env.ADMIN_NAME ?? 'PSERC Admin',
  },
}));
