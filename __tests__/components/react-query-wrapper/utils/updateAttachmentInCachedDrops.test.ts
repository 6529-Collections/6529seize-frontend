import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  findDropInCachedDrops,
  reconcileDropsWithoutWaveForDisplay,
  reconcileServerDropForDisplay,
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
  rollbackRejectedReactionInCachedDrops,
  updateServerDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
  isLatestReactionMutation,
  recordReactionRequestFailed,
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

  it("returns raw server drops when protected context and reactions are fresh", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();

    beginReactionMutation({
      dropId: "drop-fresh-protected",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const rawDrop = serverDrop({
      id: "drop-fresh-protected",
      context_profile_context: contextProfileContext(":joy:"),
      reactions: [
        reactionEntry(":joy:", [
          profile("profile-1", "current-user"),
          profile("profile-2", "fresh-joy"),
        ]),
        reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
      ],
    });

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

  it("merges protected add and replace when server context is fresh but reactions are stale", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        [
          {
            id: "drop-protected-fresh-context-stale-reactions",
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-protected-fresh-context-stale-reactions",
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
        id: "drop-protected-fresh-context-stale-reactions",
        context_profile_context: {
          ...contextProfileContext(":joy:"),
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

  it("merges protected reactions when a websocket drop omits reactions", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    const otherJoyUser = profile("profile-2", "other-joy-user");
    const waveUser = profile("profile-3", "wave-user");
    const fireUser = profile("profile-4", "fire-user");
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        [
          {
            id: "drop-missing-reactions",
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [
              reactionEntry(":joy:", [currentUser, otherJoyUser]),
              reactionEntry(":wave:", [waveUser]),
              reactionEntry(":fire:", [fireUser]),
            ],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-missing-reactions",
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
        id: "drop-missing-reactions",
        context_profile_context: {
          ...contextProfileContext(":joy:"),
          rating: 9,
        },
        reactions: undefined,
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context).toMatchObject({
      rating: 9,
      reaction: ":joy:",
    });
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":joy:", [otherJoyUser, currentUser]),
      reactionEntry(":wave:", [waveUser]),
      reactionEntry(":fire:", [fireUser]),
    ]);
  });

  it("returns defined reactions when a protected remove has fresh server context but omits reactions", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();

    beginReactionMutation({
      dropId: "drop-protected-remove-missing-reactions",
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
        id: "drop-protected-remove-missing-reactions",
        context_profile_context: contextProfileContext(null),
        reactions: undefined,
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context?.reaction).toBeNull();
    expect(Array.isArray(reconciledDrop.reactions)).toBe(true);
    expect(reconciledDrop.reactions).toEqual([]);
  });

  it("treats explicit empty server reactions as empty before merging protected user", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        [
          {
            id: "drop-empty-server-reactions",
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [
              reactionEntry(":joy:", [currentUser]),
              reactionEntry(":wave:", [profile("profile-2", "cached-wave")]),
              reactionEntry(":fire:", [profile("profile-3", "cached-fire")]),
            ],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-empty-server-reactions",
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
        id: "drop-empty-server-reactions",
        context_profile_context: {
          ...contextProfileContext(":wave:"),
          rating: 9,
        },
        reactions: [],
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context).toMatchObject({
      rating: 9,
      reaction: ":joy:",
    });
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("preserves cached reactions for unprotected websocket drops that omit reactions", () => {
    const queryClient = createQueryClient();
    const cachedReactions = [
      reactionEntry(":joy:", [profile("profile-2", "cached-joy")]),
      reactionEntry(":fire:", [profile("profile-3", "cached-fire")]),
    ];
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        [
          {
            id: "drop-unprotected-missing-reactions",
            context_profile_context: contextProfileContext(":joy:"),
            reactions: cachedReactions,
          },
        ],
      ],
    });

    const cachedDisplayDrop = reconcileServerDropForDisplay({
      queryClient,
      serverDrop: serverDrop({
        id: "drop-unprotected-missing-reactions",
        context_profile_context: contextProfileContext(":server:"),
        reactions: undefined,
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(cachedDisplayDrop.context_profile_context?.reaction).toBe(
      ":server:"
    );
    expect(cachedDisplayDrop.reactions).toEqual(cachedReactions);

    const uncachedDisplayDrop = reconcileServerDropForDisplay({
      queryClient,
      serverDrop: serverDrop({
        id: "drop-unprotected-missing-no-cache",
        reactions: undefined,
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(Array.isArray(uncachedDisplayDrop.reactions)).toBe(true);
    expect(uncachedDisplayDrop.reactions).toEqual([]);
  });

  it("falls back to the removed server profile when protected local data has no profile", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();

    beginReactionMutation({
      dropId: "drop-protected-server-profile",
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
        id: "drop-protected-server-profile",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-wave"),
          ]),
        ],
      }),
      latestWaveDrop: {
        context_profile_context: contextProfileContext(":joy:"),
        reactions: [],
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context?.reaction).toBe(":joy:");
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":joy:", [profile("profile-1", "server-current-user")]),
    ]);
  });

  it("uses the protected intent profile when a protected add has no local or server profile", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "intent-current-user");

    beginReactionMutation({
      dropId: "drop-protected-intent-profile",
      waveId: "wave-1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      profile: currentUser as any,
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const reconciledDrop = reconcileServerDropForDisplay({
      queryClient,
      serverDrop: serverDrop({
        id: "drop-protected-intent-profile",
        context_profile_context: contextProfileContext(null),
        reactions: [reactionEntry(":wave:", [profile("profile-2")])],
      }),
      latestWaveDrop: {
        context_profile_context: contextProfileContext(":joy:"),
        reactions: [],
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context?.reaction).toBe(":joy:");
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2")]),
      reactionEntry(":joy:", [currentUser]),
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

  it("removes protected user when server context is fresh but reactions are stale", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();

    beginReactionMutation({
      dropId: "drop-protected-fresh-remove-stale-reactions",
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
        id: "drop-protected-fresh-remove-stale-reactions",
        context_profile_context: contextProfileContext(null),
        reactions: [
          reactionEntry(":joy:", [
            profile("profile-1", "current-user"),
            profile("profile-2", "fresh-joy"),
          ]),
          reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
        ],
      }),
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

  it("uses a protected cache snapshot when live local sources are stale", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const snapshotUser = profile("profile-1", "snapshot-user");
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-snapshot-source",
            context_profile_context: contextProfileContext(":wave:"),
            reactions: [reactionEntry(":wave:", [profile("profile-2")])],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-snapshot-source",
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
        id: "drop-snapshot-source",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [reactionEntry(":wave:", [profile("profile-2")])],
      }),
      latestWaveDrop: {
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [reactionEntry(":wave:", [profile("profile-2")])],
      },
      cachedDropSnapshot: {
        context_profile_context: contextProfileContext(":fire:"),
        reactions: [reactionEntry(":fire:", [snapshotUser])],
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context?.reaction).toBe(":fire:");
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2")]),
      reactionEntry(":fire:", [snapshotUser]),
    ]);
  });

  it("uses a protected cached copy after a stale cached copy", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        [
          {
            id: "drop-multi-cache-source",
            context_profile_context: contextProfileContext(":wave:"),
            reactions: [reactionEntry(":wave:", [profile("profile-2")])],
          },
        ],
      ],
    });
    queryClient.setQueryData([QueryKey.FEED_ITEMS, { page: 1 }], {
      pages: [
        [
          {
            item: {
              id: "drop-multi-cache-source",
              context_profile_context: contextProfileContext(":joy:"),
              reactions: [reactionEntry(":joy:", [currentUser])],
            },
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-multi-cache-source",
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
        id: "drop-multi-cache-source",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [profile("profile-2")]),
          reactionEntry(":joy:", [profile("profile-3")]),
        ],
      }),
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop.context_profile_context?.reaction).toBe(":joy:");
    expect(reconciledDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2")]),
      reactionEntry(":joy:", [profile("profile-3"), currentUser]),
    ]);
  });

  it("reconciles without-wave fetched drops and preserves page-only fields", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        [
          {
            id: "drop-without-wave-page",
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
      ],
    });

    beginReactionMutation({
      dropId: "drop-without-wave-page",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const [reconciledDrop] = reconcileDropsWithoutWaveForDisplay({
      queryClient,
      serverDrops: [
        {
          id: "drop-without-wave-page",
          drop_priority_order: 7,
          context_profile_context: contextProfileContext(":wave:"),
          reactions: [reactionEntry(":wave:", [profile("profile-2")])],
        },
      ] as any[],
      wave: { id: "wave-1" } as any,
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(reconciledDrop).not.toHaveProperty("wave");
    expect(reconciledDrop).toMatchObject({
      drop_priority_order: 7,
      context_profile_context: expect.objectContaining({
        reaction: ":joy:",
      }),
    });
    expect(reconciledDrop?.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2")]),
      reactionEntry(":joy:", [currentUser]),
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

  it("rolls back a rejected add reaction across cached drop query groups", () => {
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    const otherUser = profile("profile-2", "other-user");
    const staleWaveUser = profile("profile-3", "stale-wave-user");
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    const feedQueryKey = [QueryKey.FEED_ITEMS, { page: 1 }];
    const dropQueryKey = [QueryKey.DROP, { drop_id: "drop-rejected-add" }];

    const optimisticDrop = {
      id: "drop-rejected-add",
      type: "FULL",
      stableKey: "stable-rejected-add",
      stableHash: "hash-rejected-add",
      context_profile_context: {
        ...contextProfileContext(":joy:"),
        rating: 7,
      },
      reactions: [
        reactionEntry(":joy:", [currentUser, otherUser]),
        reactionEntry(":wave:", [currentUser, staleWaveUser]),
        reactionEntry(":fire:", [currentUser]),
      ],
      parts: [{ content: "fresh content" }],
    };
    queryClient.setQueryData(queryKey, { pages: [[optimisticDrop]] });
    queryClient.setQueryData(feedQueryKey, {
      pages: [[{ item: { ...optimisticDrop } }]],
    });
    queryClient.setQueryData(dropQueryKey, { ...optimisticDrop });

    rollbackRejectedReactionInCachedDrops(queryClient, {
      dropId: "drop-rejected-add",
      failedReaction: ":joy:",
      previousReaction: null,
      profile: currentUser as any,
    });

    const updatedDrop = queryClient.getQueryData<any>(queryKey).pages[0][0];
    expect(updatedDrop).toMatchObject({
      id: "drop-rejected-add",
      type: "FULL",
      stableKey: "stable-rejected-add",
      stableHash: "hash-rejected-add",
      parts: [{ content: "fresh content" }],
      context_profile_context: expect.objectContaining({
        rating: 7,
        reaction: null,
      }),
    });
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":joy:", [otherUser]),
      reactionEntry(":wave:", [staleWaveUser]),
    ]);
    expect(
      queryClient.getQueryData<any>(feedQueryKey).pages[0][0].item.reactions
    ).toEqual([
      reactionEntry(":joy:", [otherUser]),
      reactionEntry(":wave:", [staleWaveUser]),
    ]);
    expect(queryClient.getQueryData<any>(dropQueryKey).reactions).toEqual([
      reactionEntry(":joy:", [otherUser]),
      reactionEntry(":wave:", [staleWaveUser]),
    ]);
  });

  it("rolls back a rejected remove reaction by restoring the previous reaction", () => {
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    const otherUser = profile("profile-2", "other-user");
    const staleFireUser = profile("profile-3", "stale-fire-user");
    const queryKey = [QueryKey.DROP, { drop_id: "drop-rejected-remove" }];

    queryClient.setQueryData(queryKey, {
      id: "drop-rejected-remove",
      context_profile_context: {
        ...contextProfileContext(null),
        rating: 11,
      },
      reactions: [
        reactionEntry(":joy:", [otherUser]),
        reactionEntry(":fire:", [currentUser, staleFireUser]),
      ],
    });

    rollbackRejectedReactionInCachedDrops(queryClient, {
      dropId: "drop-rejected-remove",
      failedReaction: null,
      previousReaction: ":joy:",
      profile: currentUser as any,
    });

    const updatedDrop = queryClient.getQueryData<any>(queryKey);
    expect(updatedDrop.context_profile_context).toMatchObject({
      rating: 11,
      reaction: ":joy:",
    });
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":joy:", [otherUser, currentUser]),
      reactionEntry(":fire:", [staleFireUser]),
    ]);
  });

  it("rolls back a rejected replace reaction without touching other users", () => {
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    const waveUser = profile("profile-2", "wave-user");
    const joyUser = profile("profile-3", "joy-user");
    const fireUser = profile("profile-4", "fire-user");
    const queryKey = [QueryKey.FEED_ITEMS, { page: 1 }];

    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            item: {
              id: "drop-rejected-replace",
              context_profile_context: contextProfileContext(":joy:"),
              reactions: [
                reactionEntry(":wave:", [waveUser]),
                reactionEntry(":joy:", [currentUser, joyUser]),
                reactionEntry(":fire:", [currentUser, fireUser]),
              ],
            },
          },
        ],
      ],
    });

    rollbackRejectedReactionInCachedDrops(queryClient, {
      dropId: "drop-rejected-replace",
      failedReaction: ":joy:",
      previousReaction: ":wave:",
      profile: currentUser as any,
    });

    const updatedDrop =
      queryClient.getQueryData<any>(queryKey).pages[0][0].item;
    expect(updatedDrop.context_profile_context.reaction).toBe(":wave:");
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":wave:", [waveUser, currentUser]),
      reactionEntry(":joy:", [joyUser]),
      reactionEntry(":fire:", [fireUser]),
    ]);
  });

  it("returns a protected refetched reaction to the previous reaction after failure", () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const queryClient = createQueryClient();
    const currentUser = profile("profile-1", "current-user");
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];

    const mutation = beginReactionMutation({
      dropId: "drop-protected-then-rejected",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-protected-then-rejected",
            stableKey: "stable-protected-then-rejected",
            stableHash: "hash-protected-then-rejected",
            context_profile_context: {
              ...contextProfileContext(":joy:"),
              rating: 13,
            },
            reactions: [
              reactionEntry(":wave:", [profile("profile-2", "wave-user")]),
              reactionEntry(":joy:", [currentUser]),
            ],
          },
        ],
      ],
    });

    dateNowSpy.mockReturnValue(1_500);
    recordReactionRequestFailed(mutation, new Error("network failed"));
    if (isLatestReactionMutation(mutation)) {
      rollbackRejectedReactionInCachedDrops(queryClient, {
        dropId: "drop-protected-then-rejected",
        failedReaction: ":joy:",
        previousReaction: ":wave:",
        profile: currentUser as any,
      });
    }

    const updatedDrop = queryClient.getQueryData<any>(queryKey).pages[0][0];
    expect(updatedDrop).toMatchObject({
      stableKey: "stable-protected-then-rejected",
      stableHash: "hash-protected-then-rejected",
      context_profile_context: expect.objectContaining({
        rating: 13,
        reaction: ":wave:",
      }),
    });
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "wave-user"), currentUser]),
    ]);
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
