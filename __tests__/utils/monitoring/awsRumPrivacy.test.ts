import type { PluginContext } from "aws-rum-web";
import {
  createAwsRumPrivacyPlugin,
  sanitizeAwsRumEvent,
  sanitizeAwsRumUrl,
} from "@/utils/monitoring/awsRumPrivacy";

const AUTHOR_UUID = "12345678-1234-4abc-8def-1234567890ab";
const SESSION_TOPIC = "a".repeat(64);
const MEDIA_URL = `https://media.example.cloudfront.net/renditions/drops/author_${AUTHOR_UUID}/file-id/hls/file.m3u8?quality=auto`;

describe("AWS RUM privacy boundary", () => {
  it("replaces only author UUID path segments with a bounded placeholder", () => {
    expect(sanitizeAwsRumUrl(MEDIA_URL)).toBe(
      "https://media.example.cloudfront.net/renditions/drops/author_id/file-id/hls/file.m3u8?quality=auto"
    );
    expect(
      sanitizeAwsRumUrl(
        "https://media.example.cloudfront.net/renditions/drops/author_public/file.m3u8"
      )
    ).toBe(
      "https://media.example.cloudfront.net/renditions/drops/author_public/file.m3u8"
    );
  });

  it("sanitizes HTTP and resource URLs without mutating the source event", () => {
    const httpEvent = {
      version: "1.0.0",
      request: { method: "GET", url: MEDIA_URL },
      response: { status: 404 },
    };
    const resourceEvent = {
      version: "1.0.0",
      targetUrl: MEDIA_URL,
      initiatorType: "video",
      duration: 100,
      fileType: "video",
    };

    const sanitizedHttp = sanitizeAwsRumEvent(
      "com.amazon.rum.http_event",
      httpEvent
    );
    const sanitizedResource = sanitizeAwsRumEvent(
      "com.amazon.rum.performance_resource_event",
      resourceEvent
    );
    const payload = JSON.stringify({ sanitizedHttp, sanitizedResource });

    expect(payload).toContain("author_id");
    expect(payload).not.toContain(AUTHOR_UUID);
    expect(httpEvent.request.url).toBe(MEDIA_URL);
    expect(resourceEvent.targetUrl).toBe(MEDIA_URL);
  });

  it("redacts only the exact WalletConnect stale-topic message shape", () => {
    const message = `No matching key. session topic doesn't exist: ${SESSION_TOPIC}`;
    const sanitized = sanitizeAwsRumEvent("com.amazon.rum.js_error_event", {
      version: "1.0.0",
      type: "Error",
      message,
      stack: `Error: ${message}\n at isValidSessionTopic (walletconnect.js:1:1)`,
    });
    const payload = JSON.stringify(sanitized);

    expect(payload).toContain("[redacted-topic]");
    expect(payload).not.toContain(SESSION_TOPIC);
    expect(
      sanitizeAwsRumEvent("com.amazon.rum.js_error_event", {
        message: "A different wallet error",
      })
    ).toEqual({ message: "A different wallet error" });
  });

  it("establishes the safe page before forwarding sanitized plugin events", () => {
    const record = jest.fn();
    const recordPageView = jest.fn();
    const context = {
      record,
      recordPageView,
    } as unknown as PluginContext;
    const plugin = createAwsRumPrivacyPlugin("/[user]");

    plugin.load(context);
    context.record("com.amazon.rum.http_event", {
      request: { method: "GET", url: MEDIA_URL },
    });

    expect(recordPageView).toHaveBeenCalledWith("/[user]");
    expect(record).toHaveBeenCalledWith(
      "com.amazon.rum.http_event",
      expect.objectContaining({
        request: expect.objectContaining({
          url: expect.stringContaining("/author_id/"),
        }),
      })
    );
  });
});
