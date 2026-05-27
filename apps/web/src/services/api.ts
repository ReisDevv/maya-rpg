import axios from "axios";
import { env } from "@/lib/env";
import { tokenStorage } from "./token-storage";
import type { PaginatedRequest } from "@/types";

const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Client-Type'] = 'web';
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(undefined);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // O cookie httpOnly é enviado automaticamente pelo browser (withCredentials: true).
        // O header X-Client-Type: web instrui a API a ler e renovar via cookie.
        const { data } = await axios.post(
          `${env.apiUrl}/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'X-Client-Type': 'web' } },
        );
        tokenStorage.saveAccessToken(data.accessToken);
        processQueue(null);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function buildPaginatedParams(request: PaginatedRequest): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: request.page,
    pageSize: request.pageSize,
  };
  if (request.sortBy) params["sortBy"] = request.sortBy;
  if (request.sortOrder) params["sortOrder"] = request.sortOrder;
  if (request.search) params["search"] = request.search;
  return params;
}

export { api };
