import type { AwsRumConfig } from "aws-rum-web";

/**
 * How AWS RUM queues and sends its events.
 *
 * The SDK sends its queue on a timer. At the SDK's 5-second default an idle
 * page sent a request every few seconds, which keeps a phone's mobile radio
 * from going back to sleep, so the queue is sent at most once a minute.
 *
 * When the page becomes hidden (tab switch, app switch, screen lock, or
 * leaving the page) the SDK sends one batch with `navigator.sendBeacon`,
 * Core Web Vitals candidates first, and falls back to fetch if the beacon is
 * refused. Browsers refuse beacons over 64 KiB, so a batch is capped at a
 * size that stays below that for typical events. Events beyond one batch stay
 * queued for the next send while the page stays open.
 */
export const AWS_RUM_DISPATCH_CONFIG = {
  dispatchInterval: 60_000,
  batchLimit: 50,
  eventCacheSize: 200,
  sessionEventLimit: 200,
  retries: 2,
  useBeacon: true,
} as const satisfies Partial<AwsRumConfig>;
