import { publicEnv } from "@/config/env";

/**
 * The 6529 Stream product section (`/stream/**`) is staged behind a host flag:
 * on for local development and staging, off in production and on any host it
 * does not recognize. Off, `/stream` shows the production placeholder. It ships, and gets indexed, only after the contracts are on
 * Sepolia r4 and the copy is approved; turning it on in production is one
 * change here.
 */

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const STAGING_HOSTNAMES = new Set(["staging.6529.io"]);
const PRODUCTION_HOSTNAMES = new Set(["6529.io", "www.6529.io"]);

/** Flip to true to launch the section in production. */
export const STREAM_PRODUCT_PRODUCTION_ENABLED = false;

type StreamProductEnvironment =
  | "local"
  | "staging"
  | "production"
  | "disabled";

export function getStreamProductEnvironment(
  baseEndpoint: string
): StreamProductEnvironment {
  let hostname: string;
  try {
    hostname = new URL(baseEndpoint).hostname.toLowerCase();
  } catch {
    return "disabled";
  }
  if (LOCAL_HOSTNAMES.has(hostname)) {
    return "local";
  }
  if (STAGING_HOSTNAMES.has(hostname)) {
    return "staging";
  }
  if (PRODUCTION_HOSTNAMES.has(hostname)) {
    return STREAM_PRODUCT_PRODUCTION_ENABLED ? "production" : "disabled";
  }
  return "disabled";
}

export function isStreamProductEnabled(
  baseEndpoint: string = publicEnv.BASE_ENDPOINT
): boolean {
  return getStreamProductEnvironment(baseEndpoint) !== "disabled";
}
