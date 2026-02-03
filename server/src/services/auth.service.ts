import User from '../models/user.model';
import { generateToken } from '../utils/jwt';

export const registerUser = async (name: string, email: string, password: string) => {
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()),
    };
  } else {
    throw new Error('Invalid user data');
  }
};

export const authUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};
