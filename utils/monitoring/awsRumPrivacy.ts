import type { Plugin, PluginContext } from "aws-rum-web";

const AWS_RUM_HTTP_EVENT_TYPE = "com.amazon.rum.http_event";
const AWS_RUM_JS_ERROR_EVENT_TYPE = "com.amazon.rum.js_error_event";
const AWS_RUM_RESOURCE_EVENT_TYPE = "com.amazon.rum.performance_resource_event";
const AWS_RUM_PRIVACY_PLUGIN_ID = "6529-aws-rum-privacy";
const AUTHOR_UUID_SEGMENT =
  /^author_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WALLETCONNECT_STALE_TOPIC =
  /No matching key\. session topic doesn't exist: [0-9a-f]{32,128}/gi;
const WALLETCONNECT_STALE_TOPIC_REPLACEMENT =
  "No matching key. session topic doesn't exist: [redacted-topic]";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeAuthorUuidSegment(segment: string): string {
  let decodedSegment = segment;
  try {
    decodedSegment = decodeURIComponent(segment);
  } catch {
    // Keep the original segment for a narrow literal match.
  }

  return AUTHOR_UUID_SEGMENT.test(decodedSegment) ? "author_id" : segment;
}

export function sanitizeAwsRumUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value, "https://rum.local");
  } catch {
    return value;
  }

  const segments = url.pathname.split("/");
  const sanitizedSegments = segments.map(sanitizeAuthorUuidSegment);
  if (
    segments.every((segment, index) => segment === sanitizedSegments[index])
  ) {
    return value;
  }

  url.pathname = sanitizedSegments.join("/");
  return /^https?:\/\//i.test(value)
    ? url.toString()
    : `${url.pathname}${url.search}${url.hash}`;
}

function sanitizeWalletConnectTopic(value: string): string {
  return value.replace(
    WALLETCONNECT_STALE_TOPIC,
    WALLETCONNECT_STALE_TOPIC_REPLACEMENT
  );
}

function sanitizeHttpEvent(eventData: object): object {
  if (!isRecord(eventData) || !isRecord(eventData["request"])) {
    return eventData;
  }

  const request = eventData["request"];
  const url = request["url"];
  if (typeof url !== "string") {
    return eventData;
  }

  const sanitizedUrl = sanitizeAwsRumUrl(url);
  return sanitizedUrl === url
    ? eventData
    : {
        ...eventData,
        request: {
          ...request,
          url: sanitizedUrl,
        },
      };
}

function sanitizeResourceEvent(eventData: object): object {
  if (!isRecord(eventData) || typeof eventData["targetUrl"] !== "string") {
    return eventData;
  }

  const targetUrl = eventData["targetUrl"];
  const sanitizedUrl = sanitizeAwsRumUrl(targetUrl);
  return sanitizedUrl === targetUrl
    ? eventData
    : { ...eventData, targetUrl: sanitizedUrl };
}

function sanitizeJsErrorEvent(eventData: object): object {
  if (!isRecord(eventData)) {
    return eventData;
  }

  const message = eventData["message"];
  const stack = eventData["stack"];
  const sanitizedMessage =
    typeof message === "string" ? sanitizeWalletConnectTopic(message) : message;
  const sanitizedStack =
    typeof stack === "string" ? sanitizeWalletConnectTopic(stack) : stack;

  if (sanitizedMessage === message && sanitizedStack === stack) {
    return eventData;
  }

  return {
    ...eventData,
    ...(typeof sanitizedMessage === "string"
      ? { message: sanitizedMessage }
      : {}),
    ...(typeof sanitizedStack === "string" ? { stack: sanitizedStack } : {}),
  };
}

export function sanitizeAwsRumEvent(
  eventType: string,
  eventData: object
): object {
  if (eventType === AWS_RUM_HTTP_EVENT_TYPE) {
    return sanitizeHttpEvent(eventData);
  }
  if (eventType === AWS_RUM_RESOURCE_EVENT_TYPE) {
    return sanitizeResourceEvent(eventData);
  }
  if (eventType === AWS_RUM_JS_ERROR_EVENT_TYPE) {
    return sanitizeJsErrorEvent(eventData);
  }

  return eventData;
}

export function createAwsRumPrivacyPlugin(initialPageId: string): Plugin {
  return {
    getPluginId: () => AWS_RUM_PRIVACY_PLUGIN_ID,
    load: (context: PluginContext) => {
      const record = context.record;
      context.record = (eventType: string, eventData: object) => {
        record(eventType, sanitizeAwsRumEvent(eventType, eventData));
      };
      context.recordPageView(initialPageId);
    },
    enable: () => undefined,
    disable: () => undefined,
  };
}
