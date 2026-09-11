import * as Sentry from "@sentry/nextjs";
import type { Span } from "@sentry/nextjs";

export const SERVER_ROUTE_SPAN_NAMES = {
  notificationsFeedPrefetch: "notifications.feed.prefetch",
  notificationsProfilePrefetch: "notifications.profile.prefetch",
  wavesIndexDataPath: "waves.index.server_data",
  wavesMetadataFetch: "waves.metadata.fetch",
  wavesInitialFeedFetch: "waves.initial_feed.fetch",
} as const;

type ServerRouteSpanName =
  (typeof SERVER_ROUTE_SPAN_NAMES)[keyof typeof SERVER_ROUTE_SPAN_NAMES];

type ServerRouteDataPath =
  | "none"
  | "notifications_feed"
  | "profile"
  | "wave_initial_feed"
  | "wave_metadata";

type ServerRouteAuthCohort = "anonymous" | "authenticated";

type ServerRouteSpanOptions = {
  readonly name: ServerRouteSpanName;
  readonly routeFamily:
    | "/messages/[wave]"
    | "/notifications"
    | "/waves"
    | "/waves/[wave]";
  readonly dataPath: ServerRouteDataPath;
  readonly apiRequestCount?: 0 | 1 | undefined;
  readonly authCohort?: ServerRouteAuthCohort | undefined;
};

export function getServerRouteAuthCohort(
  headers: Readonly<Record<string, string>>
): ServerRouteAuthCohort {
  return headers["Authorization"] ? "authenticated" : "anonymous";
}

export async function traceServerRouteData<T>(
  options: ServerRouteSpanOptions,
  task: () => Promise<T> | T
): Promise<T> {
  let span: Span | undefined;

  try {
    span = Sentry.startInactiveSpan({
      name: options.name,
      op: "function.nextjs.server_data",
      onlyIfParent: true,
      attributes: {
        "route.family": options.routeFamily,
        "data.path": options.dataPath,
        ...(options.apiRequestCount !== undefined
          ? { "data.api_request_count": options.apiRequestCount }
          : {}),
        ...(options.authCohort ? { "auth.cohort": options.authCohort } : {}),
      },
    });
  } catch {
    // Telemetry setup must never block the route data path.
  }

  try {
    return await task();
  } catch (error) {
    try {
      span?.setStatus({ code: 2 });
    } catch {
      // Telemetry status updates must not replace the route task error.
    }
    throw error;
  } finally {
    try {
      span?.end();
    } catch {
      // Telemetry teardown must never change route behavior.
    }
  }
}
