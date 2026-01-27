import api from "./axios";


export async function askCentral(question) {
  const res = await api.post("/ai/central/ask", {
    question,
  });

  return res.data;
}