import './config/env'; // load + validate environment variables first
import { connectDB } from './config/db';
import app from './app';
import { env } from './config/env';

const start = async (): Promise<void> => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
