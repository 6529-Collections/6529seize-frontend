import "server-only";
import { randomInt } from "node:crypto";
import { getClientBuildId, VERSION_POLL_HEADERS } from "./versionPoll";

// Every hidden poll is logged (one per tab per 10-15 min); one visible poll
// in four (each visible tab polls every 2 min). `rate` scales counts back up.
const VISIBLE_SAMPLE_RATE = 4;
const MAX_AGE_MINUTES = 100_000;
const MAX_RELEASES_BEHIND = 999;

interface HeaderReader {
  readonly get: (name: string) => string | null;
}

const toBoundedInt = (value: string | null, max: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, max);
};

// Builds are full or short git SHAs; anything else is reported as "other".
const toVersionLabel = (value: string | null): string =>
  getClientBuildId(value ?? undefined)?.slice(0, 12) ?? "other";

/**
 * One space-separated line per sampled poll, on stdout, which Elastic
 * Beanstalk streams to the `web.stdout.log` CloudWatch log group:
 *
 * `version_poll v=<sha12> stale=<0|1> behind=<n> age_min=<n> hidden=<0|1> rate=<n>`
 *
 * Returns the line it wrote, or null for an unsampled poll.
 */
export function logVersionPoll(
  headers: HeaderReader | undefined,
  stale: boolean,
  sample: (rate: number) => boolean = (rate) => randomInt(rate) === 0
): string | null {
  if (!headers) return null;
  const hidden = headers.get(VERSION_POLL_HEADERS.hidden) === "1";
  const rate = hidden ? 1 : VISIBLE_SAMPLE_RATE;
  if (rate > 1 && !sample(rate)) return null;
  const line = [
    "version_poll",
    `v=${toVersionLabel(headers.get(VERSION_POLL_HEADERS.version))}`,
    `stale=${stale ? 1 : 0}`,
    `behind=${toBoundedInt(headers.get(VERSION_POLL_HEADERS.releasesBehind), MAX_RELEASES_BEHIND)}`,
    `age_min=${toBoundedInt(headers.get(VERSION_POLL_HEADERS.ageMinutes), MAX_AGE_MINUTES)}`,
    `hidden=${hidden ? 1 : 0}`,
    `rate=${rate}`,
  ].join(" ");
  process.stdout.write(`${line}\n`);
  return line;
}
