import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { fetchNotificationsV2 } from "@/services/api/notifications-v2-api";
import {
  getIdentityNotificationsInfiniteQueryOptions,
  getIdentityNotificationsQueryKey,
} from "@/services/api/notifications-query";

jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: jest.fn(() => false),
}));

jest.mock("@/services/api/notifications-v2-api", () => ({
  fetchNotificationsV2: jest.fn(),
}));

describe("notifications query options", () => {
  beforeEach(() => {
    jest.mocked(isMultiCompetitionEnabled).mockReturnValue(false);
  });
  it("separates native notification pages from the legacy cache", () => {
    const legacy = getIdentityNotificationsQueryKey({ identity: "alice" });
    jest.mocked(isMultiCompetitionEnabled).mockReturnValue(true);
    const native = getIdentityNotificationsQueryKey({ identity: "alice" });
    expect(native).not.toEqual(legacy);
    expect(native[1]).toMatchObject({ includeCompetitions: true });
  });
  it("builds the exact identity, limit, cause, and version key", () => {
    expect(
      getIdentityNotificationsQueryKey({
        identity: " Alice ",
        limit: "30",
        cause: [
          ApiNotificationCause.IdentityMentioned,
          ApiNotificationCause.DropReplied,
        ],
      })
    ).toEqual([
      "IDENTITY_NOTIFICATIONS",
      {
        identity: "alice",
        limit: "30",
        cause: "DROP_REPLIED,IDENTITY_MENTIONED",
        version: "v2",
      },
    ]);
  });

  it("continues from the raw page cursor even when all records are excluded", () => {
    const options = getIdentityNotificationsInfiniteQueryOptions({
      identity: "alice",
    });
    expect(
      options.getNextPageParam({
        notifications: [],
        unread_count: 1,
        nextPageParam: 100,
      })
    ).toBe(100);
    expect(
      options.getNextPageParam({
        notifications: [],
        unread_count: 0,
        nextPageParam: null,
      })
    ).toBeNull();
  });

  it("uses the same parameters and server headers in its query function", async () => {
    const headers = { Authorization: "Bearer token" };
    const options = getIdentityNotificationsInfiniteQueryOptions({
      identity: "alice",
      limit: "30",
      cause: null,
      headers,
    });
    const controller = new AbortController();
    (fetchNotificationsV2 as jest.Mock).mockResolvedValue({
      notifications: [],
      unread_count: 0,
    });

    await options.queryFn({
      pageParam: 42,
      signal: controller.signal,
    } as Parameters<typeof options.queryFn>[0]);

    expect(fetchNotificationsV2).toHaveBeenCalledWith({
      limit: "30",
      cause: null,
      pageParam: 42,
      signal: controller.signal,
      headers,
    });
    expect(options.initialPageParam).toBeNull();
    expect(options.staleTime).toBe(60_000);
  });
});
