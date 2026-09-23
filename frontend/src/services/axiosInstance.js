import axios from "axios";

const getBaseApiUrl = () => {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isLocalhost) {
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
        return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
      }
      return `${window.location.origin}/api`;
    }
  }
  const defaultUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
  return defaultUrl.endsWith("/api") ? defaultUrl : `${defaultUrl}/api`;
};

const axiosInstance = axios.create({
  baseURL: getBaseApiUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Browser HTTP cache bypass — API always fresh
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401 and it is not a login request, clear credentials and redirect
    if (
      error.response &&
      error.response.status === 401 &&
      error.config &&
      !error.config.url.includes("/auth/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("originalRole");
      localStorage.removeItem("originalAdminUser");
      localStorage.removeItem("originalAdminToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;