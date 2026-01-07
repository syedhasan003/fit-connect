import api from "./axios";

export const sendPrompt = async (message) => {
  const res = await api.post("/ai/central", {
    prompt: message,
  });
  return res.data;
};
