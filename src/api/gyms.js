import api from "./axios";

export const getGyms = async () => {
  const res = await api.get("/gyms");
  return res.data;
};

export const getGymById = async (id) => {
  const res = await api.get(`/gyms/${id}`);
  return res.data;
};
