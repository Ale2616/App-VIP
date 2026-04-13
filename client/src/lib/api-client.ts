import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("[API CLIENT] Request:", config.method?.toUpperCase(), config.url);
  console.log("[API CLIENT] Auth header:", config.headers.Authorization ? "PRESENT" : "MISSING");
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log("[API CLIENT] Response OK:", response.config.url, "-", response.status);
    return response;
  },
  (error) => {
    console.error("========================================");
    console.error("[API CLIENT] RESPONSE ERROR");
    console.error("========================================");
    console.error("[API CLIENT] URL:", error.config?.url);
    console.error("[API CLIENT] Status:", error.response?.status);
    console.error("[API CLIENT] Data:", error.response?.data);
    console.error("[API CLIENT] Full error:", error);
    console.error("========================================");

    // DON'T redirect on auth routes — let the calling component handle it
    // This prevents the login loop where 401 on /auth/me causes redirect
    // Also don't redirect on app creation/upload routes
    const url = error.config?.url || "";
    const isAuthRoute = url.includes("/auth/");
    const isAppRoute = url.includes("/apps/upload") || url === "/apps";

    if (error.response?.status === 401 && !isAuthRoute && !isAppRoute) {
      console.error("[API CLIENT] 401 on non-auth route, clearing token and redirecting to /login");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else if (error.response?.status === 401 && (isAuthRoute || isAppRoute)) {
      console.error("[API CLIENT] 401 on auth/app route, letting component handle it");
    }

    return Promise.reject(error);
  }
);
