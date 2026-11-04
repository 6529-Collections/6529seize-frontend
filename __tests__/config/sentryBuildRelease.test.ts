/**
 * @jest-environment node
 */
import { SENTRY_BUILD_RELEASE_OPTIONS } from "@/config/sentryBuildRelease";

const BUILD_COMMIT = "0123456789abcdef0123456789abcdef01234567";
const RELEASE_ENV_KEYS = ["SENTRY_RELEASE", "GITHUB_SHA"] as const;

type WrapConfig = (
  config: { env: Record<string, unknown> },
  options: Record<string, unknown>
) => { env?: Record<string, unknown> };

function finalEnv(options: Record<string, unknown>): Record<string, unknown> {
  // The real SDK wrapper, so an SDK upgrade that changes how the release is
  // injected fails here rather than silently renaming the client chunk again.
  const { withSentryConfig } = jest.requireActual<{
    withSentryConfig: WrapConfig;
  }>("@sentry/nextjs");
  return withSentryConfig({ env: {} }, options).env ?? {};
}

describe("Sentry build release options", () => {
  const saved: Partial<Record<(typeof RELEASE_ENV_KEYS)[number], string>> =
    {};

  beforeEach(() => {
    for (const key of RELEASE_ENV_KEYS) {
      saved[key] = process.env[key];
    }
    // What CI provides: the deployed commit.
    process.env["GITHUB_SHA"] = BUILD_COMMIT;
    delete process.env["SENTRY_RELEASE"];
  });

  afterEach(() => {
    for (const key of RELEASE_ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("would bake the commit into the bundle without these options", () => {
    expect(finalEnv({})).toHaveProperty("_sentryRelease", BUILD_COMMIT);
  });

  it("keeps the release out of the bundle", () => {
    expect(finalEnv({ ...SENTRY_BUILD_RELEASE_OPTIONS })).not.toHaveProperty(
      "_sentryRelease"
    );
  });
});
