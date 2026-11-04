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
// VERSION comes from the page, not the bundle: app/layout.tsx renders it as
// `<html data-version>`. A baked VERSION gave this chunk a new name on every
// deploy, even when no client code changed. The <html> start tag is parsed
// before any script runs, so the attribute is there when this module loads.

function readBakedPublicEnv(): PublicEnv {
  const raw =
    typeof process === "undefined"
      ? undefined
      : process.env["PUBLIC_RUNTIME_BROWSER"];
  if (!raw) {
    throw new Error("PUBLIC_RUNTIME_BROWSER is missing from this browser bundle");
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

function readPageVersion(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  // <html data-version>
  const version = document.documentElement.dataset["version"];
  return version === "" ? undefined : version;
}

function readPublicEnv(): PublicEnv {
  const baked = readBakedPublicEnv();
  const version = readPageVersion();
  return version === undefined ? baked : { ...baked, VERSION: version };
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
