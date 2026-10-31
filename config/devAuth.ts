import { getNodeEnv, publicEnv } from "./env";

const DEV_LIKE_NODE_ENVS: ReadonlySet<string> = new Set([
  "development",
  "test",
  "local",
]);

/** True for development, test and local runtimes; never for a production build. */
export const isDevLikeEnv = (): boolean =>
  DEV_LIKE_NODE_ENVS.has(getNodeEnv() ?? "");

/**
 * Dev auth applies only in dev-like runtimes, so a `USE_DEV_AUTH` value that
 * reaches any other build is ignored.
 */
export const isDevAuthEnabled = (): boolean =>
  publicEnv.USE_DEV_AUTH === "true" && isDevLikeEnv();
