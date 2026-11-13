/**
 * Sentry build options that keep the release out of the bundle.
 *
 * With a build-time release, `withSentryConfig` inlines the commit into the
 * client Sentry chunk (~138 KB br), so that chunk gets a new content-hashed
 * name on every deploy and every returning visitor downloads it again.
 * `create: false` is the SDK's deterministic-build path: no release is baked
 * in, and the client, server and edge `Sentry.init` calls set `release` from
 * VERSION at runtime. In @sentry/nextjs 10.45 creating a release at build
 * always bakes it in, so `Web Deploy - PROD` creates, associates commits with
 * and finalizes it after the deploy (ops/scripts/sentry-release.sh). Source
 * maps still resolve through content-based debug IDs.
 */
export const SENTRY_BUILD_RELEASE_OPTIONS = {
  release: { create: false },
} as const;
