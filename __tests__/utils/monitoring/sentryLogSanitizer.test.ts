import type { Log } from "@sentry/nextjs";
import { sanitizeSentryLog } from "@/utils/monitoring/sentryLogSanitizer";
import { isSensitiveSentryLogAttribute } from "@/utils/monitoring/sentrySensitiveFields";
import { sanitizeSentryEvent } from "@/utils/sentry-sanitizer";

const REDACTED = "[Filtered]";
const SYNTHETIC_WALLET = `0x${"f".repeat(40)}`;
const SYNTHETIC_TX_HASH = `0x${"a".repeat(64)}`;
const SYNTHETIC_JWT = [
  `eyJ${"a".repeat(12)}`,
  `eyJ${"b".repeat(12)}`,
  "c".repeat(12),
].join(".");
const SYNTHETIC_EMAIL = "synthetic.person@example.com";

const createLog = (
  message: Log["message"],
  attributes?: Record<string, unknown>
): Log => ({
  level: "info",
  message,
  ...(attributes ? { attributes } : {}),
});

const sanitize = (
  message: Log["message"],
  attributes?: Record<string, unknown>
): Log => {
  const sanitized = sanitizeSentryLog(createLog(message, attributes));
  expect(sanitized).not.toBeNull();
  return sanitized as Log;
};

const sanitizeEventUrl = (url: string): unknown =>
  sanitizeSentryEvent({ request: { url } }).request?.["url"];

describe("sanitizeSentryLog", () => {
  describe("URLs", () => {
    it("reduces URLs embedded in the message to the event path policy", () => {
      const url = `https://api.6529.io/api/profiles/${SYNTHETIC_WALLET}?token=synthetic-query&x=1#synthetic-fragment`;
      const eventUrl = sanitizeEventUrl(url);

      const sanitized = sanitize(`Request to ${url} failed.`);

      expect(typeof eventUrl).toBe("string");
      expect(sanitized.message).toBe(`Request to ${eventUrl} failed.`);
      expect(JSON.stringify(sanitized)).not.toContain("synthetic-query");
      expect(JSON.stringify(sanitized)).not.toContain("synthetic-fragment");
      expect(JSON.stringify(sanitized)).not.toContain(SYNTHETIC_WALLET);
    });

    it("keeps trailing punctuation next to a reduced URL", () => {
      const sanitized = sanitize(
        "Failed (https://6529.io/api/example?token=synthetic-query)."
      );

      expect(sanitized.message).not.toContain("synthetic-query");
      expect(sanitized.message).toBe("Failed (/api/example).");
    });

    it("matches the event sanitizer for URL-valued attributes and drops query details", () => {
      const url = `https://6529.io/api/profiles/${SYNTHETIC_WALLET}?token=synthetic-query#synthetic-fragment`;

      const sanitized = sanitize("loaded", {
        "url.full": url,
        "url.query": "token=synthetic-query",
        "http.fragment": "synthetic-fragment",
        route_family: "/waves/[wave]",
      });

      expect(sanitized.attributes?.["url.full"]).toBe(sanitizeEventUrl(url));
      expect(sanitized.attributes).not.toHaveProperty("url.query");
      expect(sanitized.attributes).not.toHaveProperty("http.fragment");
      expect(sanitized.attributes?.["route_family"]).toBe("/waves/[wave]");
    });

    it("redacts credential-named pairs left in free text", () => {
      const sanitized = sanitize(
        "retry /api/example?access_token=synthetic-query&page=2 ok",
        { detail: '{"refresh_token":"synthetic-json","page":"2"}' }
      );

      expect(sanitized.message).toBe(
        `retry /api/example?access_token=${REDACTED}&page=2 ok`
      );
      expect(sanitized.attributes?.["detail"]).toBe(
        `{"refresh_token":"${REDACTED}","page":"2"}`
      );
    });
  });

  describe("secrets", () => {
    it("redacts JWT-like strings, bearer tokens and Stripe-style keys in the message", () => {
      const sanitized = sanitize(
        `jwt ${SYNTHETIC_JWT} header Bearer synthetic-bearer key sk_${"1".repeat(24)}`
      );

      expect(sanitized.message).toBe(
        `jwt ${REDACTED} header Bearer ${REDACTED} key ${REDACTED}`
      );
    });

    it("redacts secret patterns inside attribute values and message parameters", () => {
      const sanitized = sanitize("signed in", {
        note: `token ${SYNTHETIC_JWT}`,
        "sentry.message.parameter.0": "Bearer synthetic-bearer",
        "sentry.message.template": "signed in as %s",
      });

      expect(sanitized.attributes).toEqual({
        note: `token ${REDACTED}`,
        "sentry.message.parameter.0": `Bearer ${REDACTED}`,
        "sentry.message.template": "signed in as %s",
      });
    });

    it.each([
      "authorization",
      "Authorization",
      "access_token",
      "refreshToken",
      "api_key",
      "apiKey",
      "password",
      "cookie",
      "set-cookie",
      "client_secret",
      "private_key",
      "signature",
      "session_id",
      "sessionId",
      "auth",
      "basic_auth",
      "auth_key",
      "evidence",
      "request_body",
      "payload",
    ])("redacts the value of the %s attribute", (key) => {
      expect(isSensitiveSentryLogAttribute(key)).toBe(true);

      const sanitized = sanitize("event", { [key]: "synthetic-secret" });

      expect(sanitized.attributes).toEqual({ [key]: REDACTED });
    });

    it.each([
      "auth_state",
      "auth_refresh_outcome",
      "reauth_required",
      "step_auth_ready_ms",
      "step_auth_provider_mounted_ms",
      "duration_auth_immediate_validation_ms",
      "duration_auth_immediate_validation_bucket",
      "status_auth_immediate_validation",
      "had_local_jwt",
      "refresh_status_code",
      "session_refresh_outcome",
      "route_family",
    ])("keeps the first-party telemetry attribute %s", (key) => {
      expect(isSensitiveSentryLogAttribute(key)).toBe(false);

      const sanitized = sanitize("event", { [key]: "synthetic-state" });

      expect(sanitized.attributes).toEqual({ [key]: "synthetic-state" });
    });

    it("preserves typed first-party telemetry values", () => {
      const attributes = {
        auth_state: "authenticated_profile",
        reauth_required: true,
        duration_ms: 125,
        "sentry.sdk.name": "sentry.javascript.nextjs",
        timed: { value: 125, unit: "millisecond" },
        buckets: ["a", "b"],
        empty: null,
      };

      expect(sanitize("event", attributes).attributes).toEqual(attributes);
    });
  });

  describe("wallet addresses and emails", () => {
    it("collapses wallet addresses in URL paths exactly like events", () => {
      const path = `/api/profiles/${SYNTHETIC_WALLET}/rep`;

      const sanitized = sanitize("loaded", { url: path });

      expect(sanitized.attributes?.["url"]).toBe(sanitizeEventUrl(path));
      expect(sanitized.attributes?.["url"]).not.toContain(SYNTHETIC_WALLET);
    });

    it("redacts full wallet addresses in free text and keeps transaction hashes", () => {
      const sanitized = sanitize(
        `wallet ${SYNTHETIC_WALLET} sent ${SYNTHETIC_TX_HASH}`,
        { wallet: `connected:${SYNTHETIC_WALLET}` }
      );

      expect(sanitized.message).toBe(
        `wallet ${REDACTED} sent ${SYNTHETIC_TX_HASH}`
      );
      expect(sanitized.attributes?.["wallet"]).toBe(`connected:${REDACTED}`);
    });

    it("redacts email addresses in the message and attributes", () => {
      const sanitized = sanitize(`invite sent to ${SYNTHETIC_EMAIL}.`, {
        recipient: SYNTHETIC_EMAIL,
        handle: "@synthetic-handle",
      });

      expect(sanitized.message).toBe(`invite sent to ${REDACTED}.`);
      expect(sanitized.attributes).toEqual({
        recipient: REDACTED,
        handle: "@synthetic-handle",
      });
    });

    it("drops user identity attributes added from the scope", () => {
      const sanitized = sanitize("event", {
        "user.id": "synthetic-user",
        "user.email": SYNTHETIC_EMAIL,
        "user.name": "synthetic-name",
        user_agent_family: "synthetic",
      });

      expect(sanitized.attributes).toEqual({ user_agent_family: "synthetic" });
    });
  });

  describe("nested attributes and unusual values", () => {
    it("sanitizes nested objects and arrays", () => {
      const sanitized = sanitize("event", {
        outer: {
          inner: {
            access_token: "synthetic-secret",
            note: `contact ${SYNTHETIC_EMAIL} wallet ${SYNTHETIC_WALLET}`,
            url: "https://6529.io/api/example?token=synthetic-query",
            "url.query": "token=synthetic-query",
          },
          list: ["Bearer synthetic-bearer", { password: "synthetic" }, 3],
        },
      });

      expect(sanitized.attributes).toEqual({
        outer: {
          inner: {
            access_token: REDACTED,
            note: `contact ${REDACTED} wallet ${REDACTED}`,
            url: "/api/example",
          },
          list: [`Bearer ${REDACTED}`, { password: REDACTED }, 3],
        },
      });
      expect(JSON.stringify(sanitized)).not.toContain("synthetic-");
    });

    it("sanitizes template messages and their parameters", () => {
      const message = Object.assign(
        new String(`user ${SYNTHETIC_EMAIL} used ${SYNTHETIC_JWT}`),
        {
          __sentry_template_string__: "user %s used %s",
          __sentry_template_values__: [SYNTHETIC_EMAIL, SYNTHETIC_JWT],
        }
      ) as Log["message"];

      const sanitized = sanitize(message, {
        "sentry.message.template": "user %s used %s",
        "sentry.message.parameter.0": SYNTHETIC_EMAIL,
        "sentry.message.parameter.1": SYNTHETIC_JWT,
      });

      expect(typeof sanitized.message).toBe("string");
      expect(sanitized.message).toBe(`user ${REDACTED} used ${REDACTED}`);
      expect(sanitized.attributes).toEqual({
        "sentry.message.template": "user %s used %s",
        "sentry.message.parameter.0": REDACTED,
        "sentry.message.parameter.1": REDACTED,
      });
    });

    it("reduces errors to scrubbed text and withholds opaque objects", () => {
      class SyntheticHandle {
        readonly secret = "synthetic-secret";
      }

      const sanitized = sanitize("event", {
        error: new TypeError(`failed for ${SYNTHETIC_EMAIL}`),
        handle: new SyntheticHandle(),
        count: BigInt(7),
        callback: () => "synthetic-secret",
        when: new Date(0),
      });

      expect(sanitized.attributes).toEqual({
        error: `TypeError: failed for ${REDACTED}`,
        handle: REDACTED,
        count: "7",
        callback: REDACTED,
        when: new Date(0),
      });
    });

    it("redacts cyclic and excessively deep structures without throwing", () => {
      const cyclic: Record<string, unknown> = { label: "synthetic" };
      cyclic["self"] = cyclic;
      let deep: Record<string, unknown> = { leaf: "synthetic-leaf" };
      for (let index = 0; index < 12; index += 1) {
        deep = { next: deep };
      }

      const sanitized = sanitize("event", { cyclic, deep });
      const serializedDeep = JSON.stringify(sanitized.attributes?.["deep"]);

      expect(sanitized.attributes?.["cyclic"]).toEqual({
        label: "synthetic",
        self: REDACTED,
      });
      expect(serializedDeep).toContain(REDACTED);
      expect(serializedDeep).not.toContain("synthetic-leaf");
    });

    it("allows repeated references that are not cycles", () => {
      const shared = { label: "synthetic" };

      const sanitized = sanitize("event", { first: shared, second: [shared] });

      expect(sanitized.attributes).toEqual({
        first: { label: "synthetic" },
        second: [{ label: "synthetic" }],
      });
    });
  });

  describe("shape and failure behavior", () => {
    it("truncates oversized text", () => {
      const sanitized = sanitize("x".repeat(5000), { note: "y".repeat(5000) });

      expect(String(sanitized.message)).toHaveLength(2048);
      expect(String(sanitized.attributes?.["note"])).toHaveLength(2048);
    });

    it("keeps level and severity and does not mutate the input", () => {
      const input: Log = {
        level: "warn",
        message: `retry ${SYNTHETIC_EMAIL}`,
        severityNumber: 13,
        attributes: { token: "synthetic-secret", nested: { token: "x" } },
      };
      const snapshot = JSON.parse(JSON.stringify(input));

      const sanitized = sanitizeSentryLog(input);

      expect(sanitized).toEqual({
        level: "warn",
        message: `retry ${REDACTED}`,
        severityNumber: 13,
        attributes: { token: REDACTED, nested: { token: REDACTED } },
      });
      expect(JSON.parse(JSON.stringify(input))).toEqual(snapshot);
    });

    it("returns an empty attribute set when the log has none", () => {
      expect(sanitizeSentryLog(createLog("plain"))).toEqual({
        level: "info",
        message: "plain",
        attributes: {},
      });
    });

    it("drops the log when its attributes cannot be read", () => {
      const attributes: Record<string, unknown> = {};
      Object.defineProperty(attributes, "broken", {
        enumerable: true,
        get() {
          throw new Error("synthetic failure");
        },
      });

      expect(sanitizeSentryLog(createLog("event", attributes))).toBeNull();
    });
  });
});
