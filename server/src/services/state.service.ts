import { State } from '../models';

const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

export const getAllStates = async () => {
  const states = await State.find().sort({ name: 1 }).lean();
  return states.map(state => ({
    code: (state.code || state._id).toUpperCase(),
    name: toTitleCase(state.name),
    districts: (state.districts || [])
      .filter(d => d && d.name)
      .map(d => ({
        _id: d._id || '',
        name: toTitleCase(d.name),
      })),
  }));
};

export const getStateById = async (id: string) => {
  return State.findById(id).lean();
};
