import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL?.toString() ?? 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setApiAccessToken(token: string | null): void {
  currentAccessToken = token;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post<{ success: boolean; data: { accessToken: string } }>(
              `${baseURL}/auth/refresh`,
              {},
              { withCredentials: true }
            )
            .then((res) => {
              const newToken = res.data.data.accessToken;
              setApiAccessToken(newToken);
              return newToken;
            })
            .catch(() => {
              setApiAccessToken(null);
              return null;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        setApiAccessToken(null);
      }
    }

    return Promise.reject(error);
  }
);
