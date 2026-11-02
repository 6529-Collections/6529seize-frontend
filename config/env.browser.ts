import type { PublicEnv } from "./env.schema";

// Turbopack browser bundles resolve `@/config/env` to this file (see
// `turbopack.resolveAlias` in config/nextConfig.ts). PUBLIC_RUNTIME is the
// output of `publicEnvSchema`: next.config.ts validates it when it bakes the
// build and again when the production server starts, so the browser reads
// the baked value as-is instead of shipping zod (~66 KB) to re-validate it.
// Server rendering and Jest keep the validating `./env.ts`. The exports
// mirror `./env.ts`.

const raw =
  typeof process === "undefined" ? undefined : process.env["PUBLIC_RUNTIME"];
if (!raw) {
  throw new Error("PUBLIC_RUNTIME is missing from this browser bundle");
}

export const publicEnv: PublicEnv = JSON.parse(raw) as PublicEnv;

export const getNodeEnv = (): string | undefined => {
  if (publicEnv.NODE_ENV) {
    return publicEnv.NODE_ENV;
  }
  if (typeof process === "undefined") {
    return undefined;
  }
  return process.env.NODE_ENV;
};
