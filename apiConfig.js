// Central base URLs (set via EXPO_PUBLIC_* env vars).
const env = typeof process !== "undefined" && process.env ? process.env : {};

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const API_BASE_URL = normalizeBaseUrl(
  env.EXPO_PUBLIC_API_URL || env.EXPO_PUBLIC_BASE_URL || env.EXPO_PUBLIC_APP_URL,
);

const APP_BASE_URL = normalizeBaseUrl(
  env.EXPO_PUBLIC_APP_URL || env.EXPO_PUBLIC_BASE_URL || env.EXPO_PUBLIC_API_URL,
);

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : true;
if (isDev) {
  console.log("API_BASE_URL:", API_BASE_URL || "(empty)");
  console.log("APP_BASE_URL:", APP_BASE_URL || "(empty)");
}

export { API_BASE_URL, APP_BASE_URL };
