/**
 * Zod publicEnvSchema tests for BASE_ENDPOINT
 *
 * Verifies:
 * - Missing/empty env handling
 * - URL format validation
 * - HTTPS enforcement (except localhost/127.0.0.1)
 * - Allowlist domain checks (including subdomains)
 * - Acceptance of valid values
 */

import type { z } from "zod";

const originalEnv = process.env;

// Fresh import to avoid module cache issues when we later test via env.ts if needed
function freshImportPublicEnvSchema() {
  jest.resetModules();
  // Adjust path if needed
   
  const mod = require("@/config/env.schema");
  if (!mod.publicEnvSchema) {
    throw new Error(
      "Expected '@/config/env.schema' to export 'publicEnvSchema'."
    );
  }
  return mod.publicEnvSchema as z.ZodTypeAny;
}

const defaultInput = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
  WS_ENDPOINT: "wss://ws.6529.io",
};

/** Helper: build a minimal valid input and override fields as needed */
function buildInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ...defaultInput,
    ...overrides,
  };
}

function expectParseToThrowWith(value: string | undefined, expected: string) {
  const schema = freshImportPublicEnvSchema();
  const input = buildInput(
    value === undefined
      ? { BASE_ENDPOINT: undefined }
      : { BASE_ENDPOINT: value }
  );
  expect(() => schema.parse(input)).toThrow(expected);
}

function expectParseToSucceed(value: string) {
  const schema = freshImportPublicEnvSchema();
  const parsed = schema.parse(buildInput({ BASE_ENDPOINT: value }));
  expect(parsed.BASE_ENDPOINT).toBe(value);
}

describe("publicEnvSchema BASE_ENDPOINT (Zod)", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const REQUIRED_MSG =
    "BASE_ENDPOINT environment variable is required. Please set it in your environment or .env.local file.";
  const INVALID_URL_MSG = "BASE_ENDPOINT must be a valid URL";
  const HTTPS_MSG =
    "BASE_ENDPOINT must use HTTPS protocol. Got: %s//. Only localhost can use HTTP.";
  const ALLOWLIST_MSG =
    "BASE_ENDPOINT domain not in allowlist. Got: %s. Allowed domains: 6529.io, www.6529.io, staging.6529.io, localhost, 127.0.0.1";

  it("throws when BASE_ENDPOINT is missing", () => {
    expectParseToThrowWith(undefined, REQUIRED_MSG);
  });

  it("throws when BASE_ENDPOINT is empty string (url validator)", () => {
    expectParseToThrowWith("", INVALID_URL_MSG);
  });

  it("throws for invalid URL format (url validator)", () => {
    expectParseToThrowWith("not-a-url", INVALID_URL_MSG);
  });

  it("throws for malformed URLs (url validator)", () => {
    expectParseToThrowWith("https://", INVALID_URL_MSG);
  });

  it("throws for non-HTTPS URLs in production (except localhost)", () => {
    expectParseToThrowWith(
      "http://example.com",
      HTTPS_MSG.replace("%s", "http:")
    );
  });

  it("throws for FTP protocol", () => {
    expectParseToThrowWith("ftp://6529.io", HTTPS_MSG.replace("%s", "ftp:"));
  });

  it("throws for non-allowlisted domain", () => {
    expectParseToThrowWith(
      "https://malicious.com",
      ALLOWLIST_MSG.replace("%s", "malicious.com")
    );
  });

  it("throws for subdomain of a non-allowlisted domain", () => {
    expectParseToThrowWith(
      "https://fake.malicious.com",
      ALLOWLIST_MSG.replace("%s", "fake.malicious.com")
    );
  });

  it("throws for domain ending with allowlisted domain string but not a subdomain", () => {
    expectParseToThrowWith(
      "https://fake6529.io",
      ALLOWLIST_MSG.replace("%s", "fake6529.io")
    );
  });

  // Valid configurations
  const validCases = [
    "https://6529.io",
    "https://www.6529.io",
    "https://staging.6529.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://api.6529.io",
    "https://6529.io/app?ref=test",
    "https://staging.6529.io:8080",
    "https://6529.io/",
  ];

  it.each(validCases)("accepts valid BASE_ENDPOINT: %s", (value) => {
    expectParseToSucceed(value);
  });
});

describe("config/env.ts publicEnv loader", () => {
  const prevEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...prevEnv };
  });

  afterEach(() => {
    process.env = prevEnv;
  });

  it("parses valid PUBLIC_RUNTIME JSON", () => {
    process.env["PUBLIC_RUNTIME"] = JSON.stringify({
      ...defaultInput,
    });
    const { publicEnv } = require("@/config/env");
    expect(publicEnv.BASE_ENDPOINT).toBe("https://6529.io");
    expect(publicEnv.API_ENDPOINT).toBe("https://api.6529.io");
  });

  it("throws for invalid BASE_ENDPOINT via PUBLIC_RUNTIME JSON", () => {
    process.env["PUBLIC_RUNTIME"] = JSON.stringify({
      ...defaultInput,
      BASE_ENDPOINT: "http://example.com", // not localhost -> should fail HTTPS rule
    });
    expect(() => require("@/config/env")).toThrow(
      "BASE_ENDPOINT must use HTTPS protocol. Got: http://. Only localhost can use HTTP."
    );
  });
});
