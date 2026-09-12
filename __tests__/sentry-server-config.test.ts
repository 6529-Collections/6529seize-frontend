import type { ErrorEvent, EventHint, NodeOptions } from "@sentry/nextjs";

const mockInit = jest.fn();

jest.mock("@sentry/nextjs", () => ({ init: mockInit }));
jest.mock("@/config/env", () => ({
  publicEnv: { SENTRY_DSN: "https://synthetic@example.com/1" },
}));

describe.each(["server", "edge"] as const)(
  "Sentry %s error capture",
  (runtime) => {
    let options: NodeOptions;

    beforeEach(async () => {
      jest.resetModules();
      mockInit.mockClear();
      if (runtime === "server") await import("../sentry.server.config");
      else await import("../sentry.edge.config");
      options = mockInit.mock.calls[0][0];
    });

    it("enables sanitized errors without activating tracing, logs, or default PII", () => {
      expect(options.enabled).toBe(true);
      expect(options.sendDefaultPii).toBe(false);
      expect(options.enableLogs).toBe(false);
      expect(options).not.toHaveProperty("tracesSampleRate");
      expect(options).not.toHaveProperty("tracesSampler");
      if (runtime === "server") {
        expect(options.skipOpenTelemetrySetup).toBe(true);
        expect(options.registerEsmLoaderHooks).toBe(false);
      }
    });

    it("keeps an actionable error while removing credentials and the Next request query", async () => {
      const event: ErrorEvent = {
        exception: {
          values: [{ type: "Error", value: "Synthetic server failure" }],
        },
        request: {
          url: "https://6529.io/api/example?token=synthetic-query",
          headers: {
            authorization: "Bearer synthetic-auth",
            cookie: "synthetic-cookie",
          },
        },
        contexts: {
          nextjs: { request_path: "/api/example?token=synthetic-query" },
        },
      };
      const sanitized = await options.beforeSend?.(event, {} as EventHint);

      expect(sanitized?.exception?.values?.[0]?.value).toBe(
        "Synthetic server failure"
      );
      expect(sanitized?.contexts?.["nextjs"]?.["request_path"]).toBe(
        "/api/example"
      );
      const serialized = JSON.stringify(sanitized);
      for (const secret of [
        "synthetic-query",
        "synthetic-auth",
        "synthetic-cookie",
      ]) {
        expect(serialized).not.toContain(secret);
      }
    });
  }
);
