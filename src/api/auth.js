import api from "./axios";

export const loginUser = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get("/users/me");
  return res.data;
};
