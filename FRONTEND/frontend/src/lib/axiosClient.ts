import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number
}
import { supabase } from './supabase';

const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

const RETRIABLE_STATUSES = [408, 429, 500, 502, 503, 504];
const MAX_RETRIES = 2;

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const originalConfig = error.config as RetryConfig | undefined;
        if (!originalConfig) return Promise.reject(error);

        const retryCount = originalConfig.__retryCount || 0;

        if (
            error.response &&
            RETRIABLE_STATUSES.includes(error.response.status) &&
            retryCount < MAX_RETRIES
        ) {
            originalConfig.__retryCount = retryCount + 1;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
            await new Promise((r) => setTimeout(r, delay));
            return api(originalConfig);
        }

        if (error.response?.status === 401) {
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !data.session) {
                await supabase.auth.signOut();
                window.location.href = '/login';
                return Promise.reject(error);
            }
            if (originalConfig) {
                originalConfig.headers.Authorization = `Bearer ${data.session.access_token}`;
                return api(originalConfig);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
