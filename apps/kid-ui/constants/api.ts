// Backend API URL configuration
// In development: set EXPO_PUBLIC_API_HOST in apps/kid-ui/.env
//   e.g. EXPO_PUBLIC_API_HOST=192.168.1.100
// In production: set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_WS_URL

const DEV_HOST = process.env.EXPO_PUBLIC_API_HOST || "localhost";
const DEV_PORT = process.env.EXPO_PUBLIC_API_PORT || "8000";

export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:${DEV_PORT}`
  : (process.env.EXPO_PUBLIC_API_URL || "https://api.companion.app");

export const WS_BASE_URL = __DEV__
  ? `ws://${DEV_HOST}:${DEV_PORT}`
  : (process.env.EXPO_PUBLIC_WS_URL || "wss://api.companion.app");
