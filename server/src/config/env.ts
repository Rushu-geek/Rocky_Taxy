import dotenv from 'dotenv';
dotenv.config();

const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredVars.forEach((v) => {
  if (!process.env[v]) {
    throw new Error(`Missing required environment variable: ${v}`);
  }
});

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
};
