import {
  SENTRY_APPLICATION_KEY,
  SENTRY_BUILD_OWNERSHIP_OPTIONS,
  SENTRY_THIRD_PARTY_FILTER_BEHAVIOUR,
} from "@/config/sentryThirdPartyFiltering";

describe("Sentry third-party filtering", () => {
  it("marks both Turbopack and webpack bundles with the runtime filter key", () => {
    expect(SENTRY_BUILD_OWNERSHIP_OPTIONS).toEqual({
      _experimental: {
        turbopackApplicationKey: SENTRY_APPLICATION_KEY,
      },
      webpack: {
        unstable_sentryWebpackPluginOptions: {
          applicationKey: SENTRY_APPLICATION_KEY,
        },
      },
    });
  });

  it("keeps mixed application and third-party stacks reportable", () => {
    expect(SENTRY_THIRD_PARTY_FILTER_BEHAVIOUR).toBe(
      "drop-error-if-exclusively-contains-third-party-frames"
    );
  });
});
