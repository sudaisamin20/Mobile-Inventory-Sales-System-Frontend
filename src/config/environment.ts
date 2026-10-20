// Environment configuration for the application
// This centralizes all environment variables and API endpoints

const ENV = import.meta.env;

export const config = {
  // API Configuration
  api: {
    baseURL: ENV.VITE_API_BASE_URL || "/api/v1",
    timeout: parseInt(ENV.VITE_API_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(ENV.VITE_API_RETRY_ATTEMPTS || "3", 10),
    retryDelay: parseInt(ENV.VITE_API_RETRY_DELAY || "1000", 10),
  },

  // Cookie Configuration
  cookies: {
    authToken: "auth_token",
    refreshToken: "refresh_token",
    userData: "user_data",
    path: "/",
    sameSite: "Strict" as const,
    secure: ENV.MODE === "production", // HTTPS only in production
    expires: 7, // 7 days
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || "Basit Mobile Zone",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    environment: ENV.MODE,
    isDevelopment: ENV.DEV,
    isProduction: ENV.PROD,
  },

  // Feature Flags
  features: {
    enableAnalytics: ENV.VITE_ENABLE_ANALYTICS === "true",
    enableErrorReporting: ENV.VITE_ENABLE_ERROR_REPORTING === "true",
  },
};

export default config;
