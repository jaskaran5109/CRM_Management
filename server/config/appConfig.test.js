import test from "node:test";
import assert from "node:assert/strict";
import { getAppConfig, resolveCorsOrigins } from "./appConfig.js";

test("resolveCorsOrigins collects and normalizes unique origins", () => {
  const origins = resolveCorsOrigins({
    FRONTEND_URL: "https://crm.vercel.app/",
    CORS_ORIGIN: "https://crm.vercel.app",
    ADDITIONAL_CORS_ORIGINS: " https://staging-crm.vercel.app/ , ",
  });

  assert.deepEqual(origins, [
    "https://crm.vercel.app",
    "https://staging-crm.vercel.app",
  ]);
});

test("getAppConfig supports MONGODB_URI fallback", () => {
  const config = getAppConfig({
    PORT: "10000",
    MONGODB_URI: "mongodb://example.test/crm",
  });

  assert.equal(config.port, 10000);
  assert.equal(config.mongoUri, "mongodb://example.test/crm");
});

test("getAppConfig disables rate limiting by default in development", () => {
  const config = getAppConfig({
    NODE_ENV: "development",
  });

  assert.equal(config.rateLimitEnabled, false);
  assert.equal(config.rateLimitMax, 150);
});

test("getAppConfig enables rate limiting by default in production", () => {
  const config = getAppConfig({
    NODE_ENV: "production",
  });

  assert.equal(config.rateLimitEnabled, true);
});

test("getAppConfig allows overriding rate limit settings", () => {
  const config = getAppConfig({
    NODE_ENV: "development",
    RATE_LIMIT_ENABLED: "true",
    RATE_LIMIT_WINDOW_MS: "60000",
    RATE_LIMIT_MAX: "25",
  });

  assert.equal(config.rateLimitEnabled, true);
  assert.equal(config.rateLimitWindowMs, 60000);
  assert.equal(config.rateLimitMax, 25);
});
