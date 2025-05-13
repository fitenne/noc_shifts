export const APP_BASE: string = import.meta.env.VITE_APP_BASE_URL;
export const API_BASE = import.meta.env.DEV
  ? new URL("/api/v1", APP_BASE)
  : "http://localhost:8080/api/v1";
