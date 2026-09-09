import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getIdentityNotificationsInfiniteQueryOptions,
  getIdentityNotificationsQueryKey,
} from "@/services/api/notifications-query";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

beforeEach(() => {
  jest.mocked(commonApiFetch).mockReset();
  jest
    .mocked(commonApiFetch)
    .mockResolvedValue({ notifications: [], unread_count: 0 });
});

it("excludes coverage server-side without narrowing All, including subsequent pages", async () => {
  const options = getIdentityNotificationsInfiniteQueryOptions({
    identity: "alice",
    causeExclude: [ApiNotificationCause.SubscriptionCoverage],
  });
  for (const pageParam of [null, 42]) {
    await options.queryFn({
      pageParam,
      signal: new AbortController().signal,
    } as Parameters<typeof options.queryFn>[0]);
    expect(commonApiFetch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        endpoint: "v2/notifications",
        params: {
          limit: "30",
          cause_exclude: "SUBSCRIPTION_COVERAGE",
          ...(pageParam === null ? {} : { id_less_than: "42" }),
        },
      })
    );
  }
});

it("keeps inclusion filters alongside exclusion and separates restricted caches", async () => {
  const options = getIdentityNotificationsInfiniteQueryOptions({
    identity: " Alice ",
    cause: [ApiNotificationCause.IdentitySubscribed],
    causeExclude: [ApiNotificationCause.SubscriptionCoverage],
  });
  await options.queryFn({
    pageParam: null,
    signal: new AbortController().signal,
  } as Parameters<typeof options.queryFn>[0]);
  expect(commonApiFetch).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        limit: "30",
        cause: "IDENTITY_SUBSCRIBED",
        cause_exclude: "SUBSCRIPTION_COVERAGE",
      },
    })
  );
  expect(options.queryKey).not.toEqual(
    getIdentityNotificationsQueryKey({
      identity: "alice",
      cause: [ApiNotificationCause.IdentitySubscribed],
    })
  );
  expect(
    getIdentityNotificationsQueryKey({ identity: "alice", causeExclude: [] })
  ).toEqual(getIdentityNotificationsQueryKey({ identity: "alice" }));
});
