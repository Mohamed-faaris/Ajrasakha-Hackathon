import { State } from '../models';

export const getAllStates = async () => {
  return State.find().sort({ name: 1 }).lean();
};

export const getStateById = async (id: string) => {
  return State.findById(id).lean();
};
