import test from "node:test";
import assert from "node:assert/strict";
import { resolveApiBaseUrl } from "./apiConfig.js";

test("resolveApiBaseUrl appends /api when env url is an origin", () => {
  assert.equal(
    resolveApiBaseUrl("https://crm-api.onrender.com/"),
    "https://crm-api.onrender.com/api",
  );
});

test("resolveApiBaseUrl preserves explicit /api suffix", () => {
  assert.equal(
    resolveApiBaseUrl("https://crm-api.onrender.com/api/"),
    "https://crm-api.onrender.com/api",
  );
});

test("resolveApiBaseUrl falls back to vite proxy in development", () => {
  assert.equal(resolveApiBaseUrl("", { isDev: true }), "/api");
});

test("resolveApiBaseUrl falls back to same-origin api path in production", () => {
  assert.equal(
    resolveApiBaseUrl("", {
      isDev: false,
      locationOrigin: "https://crm.example.com/",
    }),
    "https://crm.example.com/api",
  );
});
