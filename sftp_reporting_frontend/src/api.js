import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getFiles = async () => {
  const res = await api.get("/files");
  return res.data;
};
