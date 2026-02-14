import dotenv from 'dotenv';
dotenv.config();
import createApp from './app';
import connectDB from './config/db';
import { env } from './config/env';
import mongoose from 'mongoose';
import { createAuth } from './lib/auth';

const PORT = env.PORT;

const start = async () => {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }
  
  const auth = createAuth(db);
  const app = createApp(auth);
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
