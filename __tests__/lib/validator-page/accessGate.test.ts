/** @jest-environment node */
import {
  createAccessCookieValue,
  getValidatorGatePassword,
  hasValidatorAccess,
  isAccessCookieValid,
  isPasswordCorrect,
  sanitizeValidatorNextPath,
} from "@/lib/validator-page/accessGate";

const PASSWORD = "test-only-password-1";
const DAY_MS = 24 * 60 * 60 * 1000;
const ENV_NAMES = ["VALIDATOR_PAGE_PASSWORD", "VALIDATOR_PAGE_PUBLIC"] as const;

describe("validator page access gate", () => {
  const saved = Object.fromEntries(ENV_NAMES.map((n) => [n, process.env[n]]));

  afterEach(() => {
    for (const name of ENV_NAMES) {
      if (saved[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = saved[name];
      }
    }
  });

  it("accepts its own cookie for 30 days and not after", () => {
    const now = Date.UTC(2026, 10, 1);
    const value = createAccessCookieValue(PASSWORD, now);
    expect(isAccessCookieValid(value, PASSWORD, now)).toBe(true);
    expect(isAccessCookieValid(value, PASSWORD, now + 29 * DAY_MS)).toBe(true);
    expect(isAccessCookieValid(value, PASSWORD, now + 30 * DAY_MS)).toBe(false);
  });

  it("refuses a cookie made with another password, edited or malformed", () => {
    const now = Date.UTC(2026, 10, 1);
    const value = createAccessCookieValue(PASSWORD, now);
    const [version, expiry, signature] = value.split(".");
    expect(isAccessCookieValid(value, "another-password", now)).toBe(false);
    expect(
      isAccessCookieValid(
        `${version}.${Number(expiry) + 60}.${signature}`,
        PASSWORD,
        now
      )
    ).toBe(false);
    expect(isAccessCookieValid(`${value}x`, PASSWORD, now)).toBe(false);
    expect(isAccessCookieValid("v1.1.abc", PASSWORD, now)).toBe(false);
    expect(isAccessCookieValid(undefined, PASSWORD, now)).toBe(false);
    expect(isAccessCookieValid("", PASSWORD, now)).toBe(false);
  });

  it("refuses an expiry further out than a cookie it would issue", () => {
    const now = Date.UTC(2026, 10, 1);
    const future = createAccessCookieValue(PASSWORD, now + 2 * DAY_MS);
    expect(isAccessCookieValid(future, PASSWORD, now)).toBe(false);
  });

  it("compares passwords exactly", () => {
    expect(isPasswordCorrect(PASSWORD, PASSWORD)).toBe(true);
    expect(isPasswordCorrect(`${PASSWORD} `, PASSWORD)).toBe(false);
    expect(isPasswordCorrect("", PASSWORD)).toBe(false);
  });

  it("is open without a password or with VALIDATOR_PAGE_PUBLIC=true", () => {
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
    expect(getValidatorGatePassword()).toBeNull();
    expect(hasValidatorAccess(undefined)).toBe(true);

    process.env["VALIDATOR_PAGE_PASSWORD"] = PASSWORD;
    expect(getValidatorGatePassword()).toBe(PASSWORD);
    expect(hasValidatorAccess(undefined)).toBe(false);
    expect(hasValidatorAccess(createAccessCookieValue(PASSWORD))).toBe(true);

    process.env["VALIDATOR_PAGE_PUBLIC"] = "TRUE";
    expect(getValidatorGatePassword()).toBeNull();
    process.env["VALIDATOR_PAGE_PUBLIC"] = "false";
    expect(getValidatorGatePassword()).toBe(PASSWORD);
  });

  it.each([
    ["/validator/guide", "/validator/guide"],
    [
      "/validator/download/0.1.0-test.1/SHA256SUMS",
      "/validator/download/0.1.0-test.1/SHA256SUMS",
    ],
    ["/validator", "/validator"],
    ["https://example.com/validator", "/validator"],
    ["//example.com/validator", "/validator"],
    ["/validator/../waves", "/validator"],
    ["/validatorx", "/validator"],
    ["/validator/locked", "/validator"],
    ["/validator/unlock", "/validator"],
    ["/validator/releases.json", "/validator"],
    ["/validator/guide?x=1", "/validator"],
    [42, "/validator"],
  ])("sends %p after the password to %p", (input, expected) => {
    expect(sanitizeValidatorNextPath(input)).toBe(expected);
  });
});
