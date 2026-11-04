import type { PublicEnv } from "./env.schema";

/**
 * Public env values that change on every build, even when no code changed.
 *
 * Browser bundles must not inline them: Next names chunks by content hash, so
 * the chunk holding the baked public env got a new name on every deploy and
 * every returning visitor downloaded it again. The browser reads VERSION from
 * the page (`<html data-version>`, rendered by app/layout.tsx); no browser code
 * reads VERSION_BUILD_TIMESTAMP.
 */
export type BrowserPublicEnv = Omit<
  PublicEnv,
  "VERSION" | "VERSION_BUILD_TIMESTAMP"
>;

/** The public env baked into browser bundles: everything but the build stamp. */
export function withoutBuildStamp(env: PublicEnv): BrowserPublicEnv {
  const {
    VERSION: _version,
    VERSION_BUILD_TIMESTAMP: _buildTimestamp,
    ...browserEnv
  } = env;
  return browserEnv;
}
