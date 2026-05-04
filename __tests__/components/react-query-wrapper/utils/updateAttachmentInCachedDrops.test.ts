import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  findDropInCachedDrops,
  reconcileServerDropForDisplay,
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
  updateServerDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
} from "@/utils/monitoring/dropReactionMonitoring";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { QueryClient } from "@tanstack/react-query";

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

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("cached drop websocket updates", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    __resetDropReactionMonitoringForTests();
  });

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

  const serverDrop = (overrides: Record<string, unknown> = {}) =>
    ({
      id: "drop-1",
      wave: { id: "wave-1" },
      author: {},
      context_profile_context: contextProfileContext(":server:"),
      reactions: [reactionEntry(":server:")],
      ...overrides,
    }) as any;

  it("replaces cached drops by id and preserves stable rendering keys", () => {
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-1",
            type: "FULL",
            stableKey: "stable-key",
            stableHash: "stable-hash",
            serial_no: 1,
            parts: [
              {
                content: "",
                attachments: [
                  {
                    attachment_id: "attachment-1",
                    file_name: "sample.pdf",
                    mime_type: "application/pdf",
                    kind: "PDF",
                    status: "PROCESSING",
                    url: null,
                    error_reason: null,
                  },
                ],
              },
            ],
          },
        ],
      ],
    });

    updateDropInCachedDrops(queryClient, {
      id: "drop-1",
      serial_no: 1,
      parts: [
        {
          content: "",
          attachments: [
            {
              attachment_id: "attachment-1",
              file_name: "sample.pdf",
              mime_type: "application/pdf",
              kind: "PDF",
              status: "READY",
              url: "https://example.com/sample.pdf",
              error_reason: null,
            },
          ],
        },
      ],
    } as any);

    expect(queryClient.getQueryData<any>(queryKey).pages[0][0]).toMatchObject({
      id: "drop-1",
      type: "FULL",
      stableKey: "stable-key",
      stableHash: "stable-hash",
      parts: [
        {
          attachments: [
            {
              attachment_id: "attachment-1",
              status: "READY",
              url: "https://example.com/sample.pdf",
            },
          ],
        },
      ],
    });
  });

  it("returns raw server drops when no protected reaction intent exists", () => {
    const queryClient = createQueryClient();
    const rawDrop = serverDrop();

    expect(
      reconcileServerDropForDisplay({
        queryClient,
        serverDrop: rawDrop,
        websocketStatus: WebSocketStatus.CONNECTED,
      })
    ).toBe(rawDrop);
  });

  it("merges protected add and replace reactions into stale server drops", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        [
          {
            id: "drop-protected-add",
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-protected-add",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const reconciledDrop = reconcileServerDropForDisplay({
      queryClient,
      serverDrop: serverDrop({
        id: "drop-protected-add",
        context_profile_context: {
          ...contextProfileContext(":wave:"),
          rating: 9,
        },
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-wave"),
          ]),
          reactionEntry(":joy:", [profile("profile-3", "fresh-joy")]),
        ],
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context).toMatchObject({
      rating: 9,
      reaction: ":joy:",
    });
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":joy:", [profile("profile-3", "fresh-joy"), currentUser]),
    ]);
  });

  it("removes only the protected user from stale server reactions", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();

    beginReactionMutation({
      dropId: "drop-protected-remove",
      waveId: "wave-1",
      source: "quick-react",
      action: "remove",
      previousReaction: ":joy:",
      intendedReaction: null,
      optimisticReaction: null,
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const reconciledDrop = reconcileServerDropForDisplay({
      queryClient,
      serverDrop: serverDrop({
        id: "drop-protected-remove",
        context_profile_context: contextProfileContext(":joy:"),
        reactions: [
          reactionEntry(":joy:", [
            profile("profile-1", "current-user"),
            profile("profile-2", "fresh-joy"),
          ]),
          reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
        ],
      }),
      latestWaveDrop: {
        context_profile_context: contextProfileContext(null),
        reactions: [],
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context?.reaction).toBeNull();
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":joy:", [profile("profile-2", "fresh-joy")]),
      reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
    ]);
  });

  it("uses the latest protected local source before a stale cache snapshot", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const latestUser = profile("profile-1", "latest-user");
    const snapshotUser = profile("profile-1", "snapshot-user");

    beginReactionMutation({
      dropId: "drop-source-order",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":fire:",
      optimisticReaction: ":fire:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const reconciledDrop = reconcileServerDropForDisplay({
      queryClient,
      serverDrop: serverDrop({
        id: "drop-source-order",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-wave"),
          ]),
        ],
      }),
      latestWaveDrop: {
        context_profile_context: contextProfileContext(":fire:"),
        reactions: [reactionEntry(":fire:", [latestUser])],
      },
      cachedDropSnapshot: {
        context_profile_context: contextProfileContext(":fire:"),
        reactions: [reactionEntry(":fire:", [snapshotUser])],
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":fire:", [latestUser]),
    ]);
  });

  it("safe server cache writes use reconciled drops instead of stale raw server drops", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-safe-wrapper",
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-safe-wrapper",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    updateServerDropInCachedDrops(queryClient, {
      serverDrop: serverDrop({
        id: "drop-safe-wrapper",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-wave"),
          ]),
        ],
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const updatedDrop = queryClient.getQueryData<any>(queryKey).pages[0][0];
    expect(updatedDrop.context_profile_context.reaction).toBe(":joy:");
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("raw local cache replacement still writes the supplied display drop as-is", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-raw-local",
            context_profile_context: contextProfileContext(":wave:"),
            reactions: [reactionEntry(":wave:")],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-raw-local",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    updateDropInCachedDrops(
      queryClient,
      serverDrop({
        id: "drop-raw-local",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [reactionEntry(":wave:")],
      })
    );

    const updatedDrop = queryClient.getQueryData<any>(queryKey).pages[0][0];
    expect(updatedDrop.context_profile_context.reaction).toBe(":wave:");
    expect(updatedDrop.reactions).toEqual([reactionEntry(":wave:")]);
  });

  it("updates cached attachments by attachment id", () => {
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROP, { drop_id: "drop-1" }];
    queryClient.setQueryData(queryKey, {
      id: "drop-1",
      parts: [
        {
          attachments: [
            {
              attachment_id: "attachment-1",
              file_name: "sample.csv",
              mime_type: "text/csv",
              kind: "CSV",
              status: "PROCESSING",
              url: null,
              error_reason: null,
            },
          ],
        },
      ],
    });

    updateAttachmentInCachedDrops(queryClient, {
      attachment_id: "attachment-1",
      file_name: "sample.csv",
      mime_type: "text/csv",
      kind: "CSV",
      status: "BAD",
      url: null,
      error_reason: "Blocked",
    } as any);

    expect(
      queryClient.getQueryData<any>(queryKey).parts[0].attachments[0]
    ).toMatchObject({
      attachment_id: "attachment-1",
      status: "BAD",
      error_reason: "Blocked",
    });
  });

  it("finds cached drop reaction state across cached drop query groups", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData([QueryKey.FEED_ITEMS, { page: 1 }], {
      pages: [
        [
          {
            item: {
              id: "drop-2",
              context_profile_context: {
                rating: 0,
                min_rating: 0,
                max_rating: 0,
                reaction: ":joy:",
                boosted: false,
                bookmarked: false,
                curatable: false,
                curated: false,
              },
              reactions: [
                {
                  reaction: ":joy:",
                  profiles: [{ id: "profile-1", handle: "alice" }],
                },
              ],
            },
          },
        ],
      ],
    });

    expect(findDropInCachedDrops(queryClient, "drop-2")).toEqual({
      context_profile_context: expect.objectContaining({
        reaction: ":joy:",
      }),
      reactions: [
        {
          reaction: ":joy:",
          profiles: [{ id: "profile-1", handle: "alice" }],
        },
      ],
    });
  });
});
