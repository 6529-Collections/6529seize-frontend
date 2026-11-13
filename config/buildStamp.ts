import type { PublicEnv } from "./env.schema";

/**
 * Public env values that change on every build, even when no code changed.
 *
 * Browser bundles must not inline them: Next names chunks by content hash, so
 * the chunk holding the baked public env got a new name on every deploy and
 * every returning visitor downloaded it again. The browser reads VERSION and
 * VERSION_RELEASE_ORDER from the HTML rendered by app/layout.tsx.
 */
type BrowserPublicEnv = Omit<
  PublicEnv,
  "VERSION" | "VERSION_BUILD_TIMESTAMP" | "VERSION_RELEASE_ORDER"
>;

/** The public env baked into browser bundles: everything but the build stamp. */
export function withoutBuildStamp(env: PublicEnv): BrowserPublicEnv {
  const {
    VERSION: _version,
    VERSION_BUILD_TIMESTAMP: _buildTimestamp,
    VERSION_RELEASE_ORDER: _releaseOrder,
    ...browserEnv
  } = env;
  return browserEnv;
}
