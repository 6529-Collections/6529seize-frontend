import { QueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { prefetchNotificationsPageData } from "@/helpers/notifications.server";
import { commonApiFetch } from "@/services/api/common-api";
import { getIdentityQueryKey } from "@/services/api/identity-query";
import { fetchNotificationsV2 } from "@/services/api/notifications-v2-api";
import { getIdentityNotificationsQueryKey } from "@/services/api/notifications-query";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import type { TypedNotificationsResponse } from "@/types/feed.types";

const mockTraceServerRouteData = jest.fn(
  async (_options: unknown, task: () => Promise<unknown>) => task()
);

jest.mock("@/utils/monitoring/serverRouteTelemetry", () => ({
  getServerRouteAuthCohort: jest.fn(() => "authenticated"),
  SERVER_ROUTE_SPAN_NAMES: {
    notificationsFeedPrefetch: "notifications.feed.prefetch",
    notificationsProfilePrefetch: "notifications.profile.prefetch",
  },
  traceServerRouteData: (options: unknown, task: () => Promise<unknown>) =>
    mockTraceServerRouteData(options, task),
}));

jest.mock("jwt-decode", () => ({ jwtDecode: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("@/services/api/notifications-v2-api", () => ({
  fetchNotificationsV2: jest.fn(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchWaveDropsFeedV2: jest.fn(),
}));
jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWavesV2Page: jest.fn(),
}));

const profile = {
  id: "profile-1",
  handle: "Alice",
} as ApiIdentity;
const notifications = {
  notifications: [],
  unread_count: 0,
} as TypedNotificationsResponse;

describe("prefetchNotificationsPageData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTraceServerRouteData.mockImplementation(
      async (_options: unknown, task: () => Promise<unknown>) => task()
    );
    (jwtDecode as jest.Mock).mockReturnValue({ sub: "0xABC" });
    (commonApiFetch as jest.Mock).mockResolvedValue(profile);
    (fetchNotificationsV2 as jest.Mock).mockResolvedValue(notifications);
  });

  it("hydrates the mounted profile and notifications query shapes", async () => {
    const queryClient = new QueryClient();
    const headers = { Authorization: "Bearer token" };

    await prefetchNotificationsPageData({ queryClient, headers });

    expect(commonApiFetch).toHaveBeenCalledTimes(1);
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "identities/0xabc",
      headers,
    });
    expect(fetchNotificationsV2).toHaveBeenCalledWith({
      limit: "30",
      cause: null,
      pageParam: null,
      signal: expect.any(AbortSignal),
      headers,
    });
    expect(getIdentityQueryKey("0xABC")).toEqual([QueryKey.PROFILE, "0xabc"]);
    expect(queryClient.getQueryData(getIdentityQueryKey("0xABC"))).toEqual(
      profile
    );
    expect(
      queryClient.getQueryData(
        getIdentityNotificationsQueryKey({
          identity: "Alice",
          limit: "30",
          cause: null,
        })
      )
    ).toEqual({
      pages: [notifications],
      pageParams: [null],
    });

    const hydratedRootKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey[0]);
    expect(hydratedRootKeys).toEqual([
      QueryKey.PROFILE,
      QueryKey.IDENTITY_NOTIFICATIONS,
    ]);
    expect(fetchWaveDropsFeedV2).not.toHaveBeenCalled();
    expect(fetchWavesV2Page).not.toHaveBeenCalled();
    expect(mockTraceServerRouteData).toHaveBeenNthCalledWith(
      1,
      {
        name: "notifications.profile.prefetch",
        routeFamily: "/notifications",
        dataPath: "profile",
        apiRequestCount: 1,
        authCohort: "authenticated",
      },
      expect.any(Function)
    );
    expect(mockTraceServerRouteData).toHaveBeenNthCalledWith(
      2,
      {
        name: "notifications.feed.prefetch",
        routeFamily: "/notifications",
        dataPath: "notifications_feed",
        apiRequestCount: 1,
        authCohort: "authenticated",
      },
      expect.any(Function)
    );
  });

  it("does not fetch or seed user data without authentication", async () => {
    const queryClient = new QueryClient();

    await prefetchNotificationsPageData({ queryClient, headers: {} });

    expect(jwtDecode).not.toHaveBeenCalled();
    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(fetchNotificationsV2).not.toHaveBeenCalled();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("ignores an Authorization header without a bearer value", async () => {
    const queryClient = new QueryClient();

    await prefetchNotificationsPageData({
      queryClient,
      headers: { Authorization: "token" },
    });

    expect(jwtDecode).not.toHaveBeenCalled();
    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(fetchNotificationsV2).not.toHaveBeenCalled();
  });

  it("does not prefetch when the bearer token cannot be decoded", async () => {
    const queryClient = new QueryClient();
    (jwtDecode as jest.Mock).mockImplementationOnce(() => {
      throw new Error("invalid token");
    });

    await prefetchNotificationsPageData({
      queryClient,
      headers: { Authorization: "Bearer invalid" },
    });

    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(fetchNotificationsV2).not.toHaveBeenCalled();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("seeds the fetched profile but skips notifications when it has no handle", async () => {
    const queryClient = new QueryClient();
    const profileWithoutHandle = { ...profile, handle: null };
    (commonApiFetch as jest.Mock).mockResolvedValue(profileWithoutHandle);

    await prefetchNotificationsPageData({
      queryClient,
      headers: { Authorization: "Bearer token" },
    });

    expect(queryClient.getQueryData(getIdentityQueryKey("0xABC"))).toEqual(
      profileWithoutHandle
    );
    expect(fetchNotificationsV2).not.toHaveBeenCalled();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
  });

  it("leaves the route fallback to handle profile fetch failures", async () => {
    const queryClient = new QueryClient();
    (commonApiFetch as jest.Mock).mockRejectedValue(
      new Error("profile failed")
    );

    await expect(
      prefetchNotificationsPageData({
        queryClient,
        headers: { Authorization: "Bearer token" },
      })
    ).rejects.toThrow("profile failed");

    expect(fetchNotificationsV2).not.toHaveBeenCalled();
  });
});
