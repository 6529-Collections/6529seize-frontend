import type { PublicEnv } from "./env.schema";

// Turbopack browser bundles resolve `@/config/env` to this file (see
// `turbopack.resolveAlias` in config/nextConfig.ts). PUBLIC_RUNTIME_BROWSER is
// the output of `publicEnvSchema` without the per-build stamp (see
// config/buildStamp.ts): next.config.ts validates it when it bakes the build
// and again when the production server starts, so the browser reads the baked
// value as-is instead of shipping zod (~66 KB) to re-validate it. Server
// rendering and Jest keep the validating `./env.ts`. The exports mirror
// `./env.ts`.
//
// The build stamp comes from the <html> attributes rendered by app/layout.tsx.
// The start tag is parsed before any script runs, so these values are there
// when this module loads.

/** Decode the public environment validated and baked by the build. */
function readBakedPublicEnv(): PublicEnv {
  const raw =
    typeof process === "undefined"
      ? undefined
      : process.env["PUBLIC_RUNTIME_BROWSER"];
  if (!raw) {
    throw new Error(
      "PUBLIC_RUNTIME_BROWSER is missing from this browser bundle"
    );
  }
  try {
    return JSON.parse(raw) as PublicEnv;
  } catch (error) {
    throw new Error(
      "PUBLIC_RUNTIME_BROWSER in this browser bundle is not valid JSON",
      { cause: error }
    );
  }
}

/** Restore the per-build values from the document that loaded this bundle. */
function readPublicEnv(): PublicEnv {
  const baked = readBakedPublicEnv();
  if (typeof document === "undefined") return baked;

  const { version, releaseOrder } = document.documentElement.dataset;
  return {
    ...baked,
    ...(version ? { VERSION: version } : {}),
    ...(releaseOrder ? { VERSION_RELEASE_ORDER: releaseOrder } : {}),
  };
}

export const publicEnv: PublicEnv = readPublicEnv();

export const getNodeEnv = (): string | undefined => {
  if (publicEnv.NODE_ENV) {
    return publicEnv.NODE_ENV;
  }
  if (typeof process === "undefined") {
    return undefined;
  }
  return process.env.NODE_ENV;
};
