export function normalizeOrigin(value = "") {
  return String(value).trim().replace(/\/+$/, "");
}

export function resolveApiBaseUrl(
  envApiUrl,
  { isDev = false, locationOrigin } = {},
) {
  const normalizedEnv = normalizeOrigin(envApiUrl);

  if (normalizedEnv) {
    return normalizedEnv.endsWith("/api")
      ? normalizedEnv
      : `${normalizedEnv}/api`;
  }

  if (isDev) {
    return "/api";
  }

  const normalizedLocation = normalizeOrigin(locationOrigin);
  return normalizedLocation ? `${normalizedLocation}/api` : "/api";
}

export function getApiBaseUrl() {
  return resolveApiBaseUrl(import.meta.env.VITE_API_URL, {
    isDev: import.meta.env.DEV,
    locationOrigin: typeof window !== "undefined" ? window.location.origin : "",
  });
}
