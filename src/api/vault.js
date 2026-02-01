import api from "./client";

export const getVaultItems = async () => {
  const res = await api.get("/vault");
  return res.data;
};

export const getVaultItemById = async (id) => {
  const res = await api.get(`/vault/${id}`);
  return res.data;
};
