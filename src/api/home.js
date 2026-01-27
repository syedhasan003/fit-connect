import api from "./axios";

export const fetchHomeOverview = async () => {
  const res = await api.get("/home/overview");
  return res.data;
};
