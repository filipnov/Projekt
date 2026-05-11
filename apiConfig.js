// Central base URLs (set via EXPO_PUBLIC_* env vars).
const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    process.env.EXPO_PUBLIC_APP_URL ||
    "",
);

const APP_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_APP_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "",
);

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : true;
if (isDev) {
  console.log("API_BASE_URL:", API_BASE_URL || "(empty)");
  console.log("APP_BASE_URL:", APP_BASE_URL || "(empty)");
}

export { API_BASE_URL, APP_BASE_URL };
