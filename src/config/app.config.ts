import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/pserc',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ?? 'pserc-dev-access-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '1d',
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
