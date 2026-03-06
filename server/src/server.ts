// Import env first to load dotenv before any other modules
import { env } from './config/env';
import createApp from './app';
import connectDB from './config/db';
import mongoose from 'mongoose';
import { createAuth } from './lib/auth';

const PORT = env.PORT;

const start = async () => {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  const auth = createAuth(db, mongoose.connection.getClient());
  const app = createApp(auth);
  
  // startScheduler(); moved to python prediction service
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
