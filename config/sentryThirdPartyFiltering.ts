export const SENTRY_APPLICATION_KEY = "6529-frontend";

export const SENTRY_THIRD_PARTY_FILTER_BEHAVIOUR =
  "drop-error-if-exclusively-contains-third-party-frames" as const;

export const SENTRY_BUILD_OWNERSHIP_OPTIONS = {
  _experimental: {
    turbopackApplicationKey: SENTRY_APPLICATION_KEY,
  },
  webpack: {
    unstable_sentryWebpackPluginOptions: {
      applicationKey: SENTRY_APPLICATION_KEY,
    },
  },
} as const;
