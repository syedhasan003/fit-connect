import api from "./axios";

export const fetchHomeOverview = async () => {
  const res = await api.get("/home/");
  return res.data;
};
