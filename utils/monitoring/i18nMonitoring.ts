import * as Sentry from "@sentry/nextjs";

/**
 * Reports a message key that a browser bundle rendered without registering
 * its en-US copy: a module uses a namespace it does not import. The key is a
 * code identifier, never user content. One event per key, without the
 * page's breadcrumbs, request, user or other context. Monitoring failures
 * never affect rendering.
 */
export function reportUnregisteredMessageKey(key: string): void {
  try {
    const reported = new Error(`Unregistered en-US message key: ${key}`);
    reported.name = "UnregisteredMessageKeyError";
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setFingerprint(["i18n-unregistered-message-key", key]);
      // Isolation-scope data is merged after withScope. Remove inherited
      // context from this event without changing the scope other errors use.
      scope.addEventProcessor((event) => {
        const bounded = {
          ...event,
          tags: { feature: "i18n", message_key: key },
        };
        delete bounded.breadcrumbs;
        delete bounded.extra;
        delete bounded.request;
        delete bounded.user;
        delete bounded.contexts;
        delete bounded.transaction;
        return bounded;
      });
      Sentry.captureException(reported);
    });
  } catch {
    // Error reporting must not change what the page renders.
  }
}
