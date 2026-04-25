const normalizeOrigin = (value = "") => String(value).trim().replace(/\/+$/, "");
const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
};

export function resolveCorsOrigins(env = process.env) {
  const rawOrigins = [
    env.FRONTEND_URL,
    env.CORS_ORIGIN,
    ...(env.ADDITIONAL_CORS_ORIGINS || "").split(","),
  ];

  return [...new Set(rawOrigins.map(normalizeOrigin).filter(Boolean))];
}

export function getAppConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";

  return {
    port: Number(env.PORT) || 5000,
    mongoUri: env.MONGO_URI || env.MONGODB_URI || "",
    frontendUrl: normalizeOrigin(env.FRONTEND_URL),
    corsOrigins: resolveCorsOrigins(env),
    nodeEnv,
    rateLimitEnabled: parseBoolean(
      env.RATE_LIMIT_ENABLED,
      nodeEnv === "production",
    ),
    rateLimitWindowMs: Number(env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMax: Number(env.RATE_LIMIT_MAX) || 150,
  };
}
