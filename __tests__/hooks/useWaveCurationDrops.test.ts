import { renderHook } from "@testing-library/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
} from "@/utils/monitoring/dropReactionMonitoring";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/common-api");
let mockConnectedProfileId: string | null = "profile-1";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile:
      mockConnectedProfileId === null ? null : { id: mockConnectedProfileId },
  }),
}));
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));
jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const scope = {
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      setTag: jest.fn(),
      setExtras: jest.fn(),
    };
    callback(scope);
  }),
  captureException: jest.fn(),
}));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const queryClient = {
  getQueriesData: jest.fn(),
  setQueriesData: jest.fn(),
};
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe("useWaveCurationDrops", () => {
  const contextProfileContext = (reaction: string | null) => ({
    rating: 0,
    min_rating: 0,
    max_rating: 0,
    reaction,
    boosted: false,
    bookmarked: false,
    curatable: false,
    curated: false,
  });

  const profile = (id: string, handle = id) => ({ id, handle });

  const reactionEntry = (
    reaction: string,
    profiles = [profile("profile-1")]
  ) => ({
    reaction,
    profiles,
  });

  const wave = {
    id: "wave-1",
    name: "Wave 1",
    picture: null,
    description_drop: { id: "description-drop" },
    last_drop_time: 0,
    voting: {
      authenticated_user_eligible: false,
      scope: { group: null },
      period: null,
      credit_type: "TDH",
      credit_nfts: null,
      forbid_negative_votes: false,
    },
    visibility: { scope: { group: null } },
    participation: {
      authenticated_user_eligible: false,
      scope: { group: null },
      submission_strategy: null,
    },
    chat: {
      authenticated_user_eligible: false,
      scope: { group: null },
    },
    wave: {
      authenticated_user_eligible_for_admin: false,
      admin_group: { group: null },
      admin_drop_deletion_enabled: false,
    },
    pinned: false,
    identity_wave: false,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectedProfileId = "profile-1";
    __resetDropReactionMonitoringForTests();
    queryClient.getQueriesData.mockReturnValue([]);
    commonApiFetchMock.mockResolvedValue({ page: 1, next: null, data: [] });
    useQueryClientMock.mockReturnValue(queryClient);
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    __resetDropReactionMonitoringForTests();
  });

  it("reconciles in-flight query responses with the profile that started the request", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const currentUser = profile("profile-1", "current-user");
    queryClient.getQueriesData.mockImplementation(
      ({ queryKey }: { queryKey: readonly unknown[] }) =>
        queryKey[0] === QueryKey.DROPS
          ? [
              [
                [QueryKey.DROPS, { waveId: "wave-1" }],
                {
                  pages: [
                    {
                      data: [
                        {
                          id: "drop-profile-switch",
                          context_profile_context:
                            contextProfileContext(":joy:"),
                          reactions: [reactionEntry(":joy:", [currentUser])],
                        },
                      ],
                    },
                  ],
                },
              ],
            ]
          : []
    );

    beginReactionMutation({
      dropId: "drop-profile-switch",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    const response = deferred<any>();
    commonApiFetchMock.mockReturnValue(response.promise);

    const { rerender } = renderHook(() =>
      useWaveCurationDrops({
        wave,
        curationId: "curation-1",
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    const pagePromise = options.queryFn({ pageParam: 1 });

    mockConnectedProfileId = "profile-2";
    rerender();
    response.resolve({
      page: 1,
      next: null,
      data: [
        {
          id: "drop-profile-switch",
          context_profile_context: contextProfileContext(":wave:"),
          reactions: [
            reactionEntry(":wave:", [
              profile("profile-1", "server-current-user"),
              profile("profile-2", "server-wave"),
            ]),
          ],
        },
      ],
    });

    const page = await pagePromise;

    expect(page.data[0].context_profile_context.reaction).toBe(":joy:");
    expect(page.data[0].reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "server-wave")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });
});
