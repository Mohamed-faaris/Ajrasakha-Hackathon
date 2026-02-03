import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/db';
import { env } from './config/env';

dotenv.config();

const PORT = env.PORT;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
