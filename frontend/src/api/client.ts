import axios from "axios";
import { clearAuthToken, markAuthExpired, readAuthToken } from "@/lib/authStorage";
import { env } from "@/lib/env";

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const hadToken = Boolean(error?.config?.headers?.Authorization);
    if (status === 401 && hadToken) {
      const url = String(error.config?.url ?? "");
      if (!url.includes("/auth/logout")) {
        markAuthExpired();
      }
      clearAuthToken();
    }
    return Promise.reject(error);
  },
);
