import axios from "axios";

const getApiBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (!baseUrl || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      return "/api";
    }
  }
  if (!baseUrl) return "/api";
  return baseUrl.replace(/\/+$/, "") + (baseUrl.endsWith("/api") ? "" : "/api");
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// BUG-10 FIX: Office hours in-memory caching & request deduplication
let officeHoursCache = null;
let officeHoursCacheTime = 0;
let officeHoursInFlight = null;

const originalGet = axiosInstance.get.bind(axiosInstance);
axiosInstance.get = function (url, config) {
  if (typeof url === "string" && url.includes("/settings/office-hours")) {
    const now = Date.now();
    // Return cached office hours if fresh (< 3 minutes)
    if (officeHoursCache && now - officeHoursCacheTime < 180000) {
      return Promise.resolve({
        data: officeHoursCache,
        status: 200,
        statusText: "OK",
        headers: {},
        config: config || {},
      });
    }
    // Deduplicate concurrent in-flight requests (e.g. 5 popups mounting at once)
    if (officeHoursInFlight) {
      return officeHoursInFlight;
    }
    officeHoursInFlight = originalGet(url, config)
      .then((res) => {
        if (res.data?.success) {
          officeHoursCache = res.data;
          officeHoursCacheTime = Date.now();
        }
        officeHoursInFlight = null;
        return res;
      })
      .catch((err) => {
        officeHoursInFlight = null;
        // Fall back gracefully to cached data if available on 429
        if (officeHoursCache) {
          return {
            data: officeHoursCache,
            status: 200,
            statusText: "OK",
            headers: {},
            config: config || {},
          };
        }
        throw err;
      });
    return officeHoursInFlight;
  }
  return originalGet(url, config);
};

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Clear office-hours cache when updated
  if (
    (config.method === "put" || config.method === "post") &&
    config.url?.includes("/settings/office-hours")
  ) {
    officeHoursCache = null;
    officeHoursCacheTime = 0;
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