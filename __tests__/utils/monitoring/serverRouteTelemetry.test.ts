const mockSpanEnd = jest.fn();
const mockSpanSetStatus = jest.fn();
const mockStartInactiveSpan = jest.fn((_options?: unknown) => ({
  end: mockSpanEnd,
  setStatus: mockSpanSetStatus,
}));

jest.mock("@sentry/nextjs", () => ({
  SPAN_STATUS_ERROR: 2,
  startInactiveSpan: (options?: unknown) => mockStartInactiveSpan(options),
}));

import {
  getServerRouteAuthCohort,
  SERVER_ROUTE_SPAN_NAMES,
  traceServerRouteData,
} from "@/utils/monitoring/serverRouteTelemetry";

describe("serverRouteTelemetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartInactiveSpan.mockImplementation(() => ({
      end: mockSpanEnd,
      setStatus: mockSpanSetStatus,
    }));
  });

  it("records only low-cardinality route-data attributes", async () => {
    const result = await traceServerRouteData(
      {
        name: SERVER_ROUTE_SPAN_NAMES.wavesMetadataFetch,
        routeFamily: "/waves/[wave]",
        dataPath: "wave_metadata",
        apiRequestCount: 1,
        authCohort: "authenticated",
      },
      () => "wave"
    );

    expect(result).toBe("wave");
    expect(mockStartInactiveSpan).toHaveBeenCalledWith({
      name: "waves.metadata.fetch",
      op: "function.nextjs.server_data",
      onlyIfParent: true,
      attributes: {
        "route.family": "/waves/[wave]",
        "data.path": "wave_metadata",
        "data.api_request_count": 1,
        "auth.cohort": "authenticated",
      },
    });
    expect(mockSpanEnd).toHaveBeenCalledTimes(1);

    const serializedOptions = JSON.stringify(
      mockStartInactiveSpan.mock.calls[0]?.[0]
    );
    expect(serializedOptions).not.toContain("private-wave-id");
    expect(serializedOptions).not.toContain("https://");
    expect(serializedOptions).not.toContain("Authorization");
  });

  it("omits request count when nested hydration can issue more than one call", async () => {
    await traceServerRouteData(
      {
        name: SERVER_ROUTE_SPAN_NAMES.wavesInitialFeedFetch,
        routeFamily: "/messages/[wave]",
        dataPath: "wave_initial_feed",
        authCohort: "authenticated",
      },
      () => "feed"
    );

    expect(mockStartInactiveSpan).toHaveBeenCalledWith({
      name: "waves.initial_feed.fetch",
      op: "function.nextjs.server_data",
      onlyIfParent: true,
      attributes: {
        "route.family": "/messages/[wave]",
        "data.path": "wave_initial_feed",
        "auth.cohort": "authenticated",
      },
    });
    const spanOptions = mockStartInactiveSpan.mock.calls[0]?.[0] as {
      readonly attributes: Record<string, unknown>;
    };
    expect(Object.keys(spanOptions.attributes)).not.toContain(
      "data.api_request_count"
    );
  });

  it("rethrows task errors after ending the span", async () => {
    const taskError = new Error("data path failed");

    await expect(
      traceServerRouteData(
        {
          name: SERVER_ROUTE_SPAN_NAMES.notificationsFeedPrefetch,
          routeFamily: "/notifications",
          dataPath: "notifications_feed",
          apiRequestCount: 1,
          authCohort: "authenticated",
        },
        () => {
          throw taskError;
        }
      )
    ).rejects.toBe(taskError);
    expect(mockSpanSetStatus).toHaveBeenCalledWith({ code: 2 });
    expect(mockSpanEnd).toHaveBeenCalledTimes(1);
  });

  it("keeps the task running when Sentry span setup fails", async () => {
    mockStartInactiveSpan.mockImplementationOnce(() => {
      throw new Error("Sentry setup failed");
    });
    const task = jest.fn(() => "ok");

    await expect(
      traceServerRouteData(
        {
          name: SERVER_ROUTE_SPAN_NAMES.wavesIndexDataPath,
          routeFamily: "/waves",
          dataPath: "none",
          apiRequestCount: 0,
        },
        task
      )
    ).resolves.toBe("ok");
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("keeps a successful task successful when span ending fails", async () => {
    mockSpanEnd.mockImplementationOnce(() => {
      throw new Error("Sentry end failed");
    });

    await expect(
      traceServerRouteData(
        {
          name: SERVER_ROUTE_SPAN_NAMES.notificationsProfilePrefetch,
          routeFamily: "/notifications",
          dataPath: "profile",
          apiRequestCount: 1,
          authCohort: "anonymous",
        },
        () => "profile"
      )
    ).resolves.toBe("profile");
  });

  it("preserves the task error when the Sentry status update fails", async () => {
    const taskError = new Error("original route error");
    mockSpanSetStatus.mockImplementationOnce(() => {
      throw new Error("Sentry status failed");
    });

    await expect(
      traceServerRouteData(
        {
          name: SERVER_ROUTE_SPAN_NAMES.wavesMetadataFetch,
          routeFamily: "/waves/[wave]",
          dataPath: "wave_metadata",
          apiRequestCount: 1,
          authCohort: "authenticated",
        },
        () => {
          throw taskError;
        }
      )
    ).rejects.toBe(taskError);
    expect(mockSpanEnd).toHaveBeenCalledTimes(1);
  });

  it("derives only anonymous or authenticated server cohorts", () => {
    expect(getServerRouteAuthCohort({})).toBe("anonymous");
    expect(
      getServerRouteAuthCohort({ Authorization: "Bearer private-token" })
    ).toBe("authenticated");
  });
});
