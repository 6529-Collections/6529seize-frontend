import type { Event } from "@sentry/nextjs";
import {
  filterMalformedNextActionProbeErrors,
  filterServerActionProbeErrors,
  filterWebStreamsProbeErrors,
  tagSecurityProbes,
} from "@/config/sentryProbes";

const SERVER_ACTION_NOT_FOUND_MESSAGE =
  "Failed to find Server Action. This request might be from an older or newer deployment.";
const WEBSTREAMS_TRANSFORM_ALGORITHM_ERROR =
  "controller[kState].transformAlgorithm is not a function";

function buildServerActionEvent({
  contentType,
  nextAction,
  method = "POST",
  url = "/AAAAAAAAAAAAAAAAAAAAA",
}: {
  readonly contentType: string;
  readonly nextAction?: string | undefined;
  readonly method?: string | undefined;
  readonly url?: string | undefined;
}): Event {
  const headers: Array<[string, string]> = [["Content-Type", contentType]];

  if (nextAction !== undefined) {
    headers.push(["Next-Action", nextAction]);
  }

  return {
    request: {
      method,
      url,
      headers,
    },
    exception: {
      values: [
        {
          type: "Error",
          value: SERVER_ACTION_NOT_FOUND_MESSAGE,
        },
      ],
    },
  } as unknown as Event;
}

function buildWebStreamsEvent({
  url,
  method = "GET",
  type = "TypeError",
  message = WEBSTREAMS_TRANSFORM_ALGORITHM_ERROR,
  tags,
}: {
  readonly url: string;
  readonly method?: string | undefined;
  readonly type?: string | undefined;
  readonly message?: string | undefined;
  readonly tags?: Record<string, string> | undefined;
}): Event {
  return {
    request: {
      method,
      url,
    },
    exception: {
      values: [
        {
          type,
          value: message,
        },
      ],
    },
    ...(tags ? { tags } : {}),
  } as unknown as Event;
}

describe("config/sentryProbes server action filtering", () => {
  it("filters Mozilla multipart requests without Next-Action header", () => {
    const event = buildServerActionEvent({
      contentType: "multipart/form-data; boundary=MozillaVT1233494417",
    });

    const result = filterServerActionProbeErrors(event);

    expect(result).toBeNull();
  });

  it("does not filter Mozilla multipart requests when Next-Action header exists", () => {
    const event = buildServerActionEvent({
      contentType: "multipart/form-data; boundary=MozillaVT1233494417",
      nextAction: "abcdef1234567890abcdef1234567890",
    });

    const result = filterServerActionProbeErrors(event);

    expect(result).toBe(event);
  });

  it("does not filter WebKit multipart requests without Next-Action header", () => {
    const event = buildServerActionEvent({
      contentType:
        "multipart/form-data; boundary=----WebKitFormBoundaryXxYyZz123456",
    });

    const result = filterServerActionProbeErrors(event);

    expect(result).toBe(event);
  });

  it("keeps existing malformed text/plain Next-Action probe filtering", () => {
    const event = buildServerActionEvent({
      contentType: "text/plain;charset=UTF-8",
      nextAction: "MozillaVT1233494417",
    });

    const result = filterMalformedNextActionProbeErrors(event);

    expect(result).toBeNull();
  });

  it("tags Mozilla multipart probe requests as server-action probes", () => {
    const event = buildServerActionEvent({
      contentType: "multipart/form-data; boundary=MozillaVT1233494417",
    });

    const result = tagSecurityProbes(event);

    expect(result.level).toBe("info");
    expect(result.tags).toEqual(
      expect.objectContaining({
        security_probe: "true",
        probe_type: "server-action-probe",
      })
    );
  });
});

describe("config/sentryProbes webstreams filtering", () => {
  it("filters transformAlgorithm probe events for .html requests", () => {
    const event = buildWebStreamsEvent({
      url: "/vt-test-non-existent.html",
    });

    const result = filterWebStreamsProbeErrors(event);

    expect(result).toBeNull();
  });

  it("keeps transformAlgorithm events for normal user profile requests", () => {
    const event = buildWebStreamsEvent({
      url: "/alice",
    });

    const result = filterWebStreamsProbeErrors(event);

    expect(result).toBe(event);
  });

  it("filters transformAlgorithm events when security_probe tag is already set", () => {
    const event = buildWebStreamsEvent({
      url: "/alice",
      tags: { security_probe: "true" },
    });

    const result = filterWebStreamsProbeErrors(event);

    expect(result).toBeNull();
  });
});
