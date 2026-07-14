import WaveDropReactions from "@/components/waves/drops/WaveDropReactions";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey as AppQueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useEmoji } from "@/contexts/EmojiContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import * as commonApi from "@/services/api/common-api";
import { __resetDropReactionMonitoringForTests } from "@/utils/monitoring/dropReactionMonitoring";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

const mockQueryCacheFindAll = jest.fn(() => []);
const mockSetQueryData = jest.fn();

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
  })),
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/helpers/Helpers", () => ({
  formatLargeNumber: (num: number) => `${num}`,
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn().mockResolvedValue(null),
}));

jest.mock(
  "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops",
  () => ({
    updateDropInCachedDrops: jest.fn(),
  })
);

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({
    getQueryCache: jest.fn(() => ({ findAll: mockQueryCacheFindAll })),
    setQueryData: mockSetQueryData,
    setQueriesData: jest.fn(),
  })),
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

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: jest.fn(() => "connected"),
}));

jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    longPressTriggered: false,
    touchHandlers: {
      onTouchStart: jest.fn(),
      onTouchMove: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn(),
    },
  })),
}));

const mockUseEmoji = useEmoji as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const { fetchDropByIdBatched } = require("@/services/api/drop-api");
const setToastMock = jest.fn();
const createStructuredReactionError = ({
  body,
  headers,
  message = "technical error",
  status,
  statusText,
}: {
  body?: unknown;
  headers?: unknown;
  message?: string;
  status?: number;
  statusText?: string;
}): Error & {
  headers?: unknown;
  status?: number;
  response: {
    body?: unknown;
    headers?: unknown;
    status?: number;
    statusText?: string;
  };
} =>
  Object.assign(new Error(message), {
    ...(headers !== undefined ? { headers } : {}),
    ...(status !== undefined ? { status } : {}),
    response: {
      ...(body !== undefined ? { body } : {}),
      ...(headers !== undefined ? { headers } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(statusText !== undefined ? { statusText } : {}),
    },
  });

type NativeEmojiMock = { skins: Array<{ native: string }> };

const createEmojiContextValue = (
  emojiMap: Array<{
    category: string;
    emojis: Array<{ id: string; skins: Array<{ src: string }> }>;
  }> = [],
  findNativeEmoji: (id: string) => NativeEmojiMock | null = () => null
) => ({
  emojiMap,
  emojiData: {},
  loading: false,
  categories: [],
  categoryIcons: {},
  findNativeEmoji,
  findCustomEmoji: (id: string) => {
    const normalized = id.replaceAll(":", "");
    for (const category of emojiMap) {
      const found = category.emojis.find((emoji) => emoji.id === normalized);
      if (found) {
        return found;
      }
    }
    return null;
  },
  loadCustomEmojis: jest.fn(() => Promise.resolve(emojiMap)),
  loadNativeEmojis: jest.fn(() => Promise.resolve({})),
  loadEmojiData: jest.fn(() => Promise.resolve()),
});

const createMockDrop = (overrides: Record<string, unknown> = {}) => ({
  id: "test-drop",
  wave: { id: "test-wave" },
  reactions: [],
  ...overrides,
});

type MockNotificationQuery = {
  readonly queryKey: readonly unknown[];
  state: {
    data: unknown;
  };
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

describe("WaveDropReactions", () => {
  const getMyStreamMock = () =>
    (
      require("@/contexts/wave/MyStreamContext") as {
        useMyStream: jest.Mock;
      }
    ).useMyStream;

  beforeEach(() => {
    // Reset call history without removing default implementations
    jest.clearAllMocks();
    __resetDropReactionMonitoringForTests();
    mockQueryCacheFindAll.mockReset();
    mockQueryCacheFindAll.mockReturnValue([]);
    mockSetQueryData.mockReset();
    mockUseAuth.mockReturnValue({
      connectedProfile: { id: "profile-1", handle: "alice" },
      activeProfileProxy: null,
      setToast: setToastMock,
    });
    getMyStreamMock().mockReturnValue({
      applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
    });
    (fetchDropByIdBatched as jest.Mock).mockResolvedValue(null);
  });

  it("renders multiple WaveDropReaction buttons", () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
          {
            category: "people",
            emojis: [{ id: "gm1", skins: [{ src: "/gm1.png" }] }],
          },
        ],
        (id: string) =>
          id === "nonexistent" ? { skins: [{ native: "😊" }] } : null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
              {
                reaction: ":gm1:",
                profiles: [{ handle: "test-handle-2", id: "2" }],
              },
            ],
          }) as any
        }
      />
    );

    // Check that buttons render (should match emojiList length)
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("renders with emoji image when emoji found", () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );
    const img = screen
      .getAllByRole("img")
      .find((el) => el.getAttribute("src")?.includes("gm.png"));
    expect(img).toBeInTheDocument();
  });

  it("renders with native emoji when not found in emojiMap", () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue([], (id: string) =>
        id === "grinning" ? { skins: [{ native: "😊" }] } : null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":grinning:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );
    const span = screen.getAllByText("😊")[0];
    expect(span).toBeInTheDocument();
  });

  it("returns null if no emoji found", () => {
    mockUseEmoji.mockReturnValue(createEmojiContextValue());

    render(<WaveDropReactions drop={createMockDrop() as any} />);
    // Since no emoji is found, these buttons will render nothing
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("toggles count and selected state on button click", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    (commonApi.commonApiPost as jest.Mock).mockResolvedValue({
      id: "test-drop",
    });
    (commonApi.commonApiDelete as jest.Mock).mockResolvedValue({
      id: "test-drop",
    });

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "test-handle-1", id: "1" },
                  { handle: "test-handle-2", id: "2" },
                ],
              },
            ],
          }) as any
        }
      />
    );
    const button = screen.getAllByRole("button")[0];

    // Initial count text should match initialCount from emojiList
    expect(button).toHaveTextContent("2");

    // Click button to increment
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("3");
    });
    expect(commonApi.commonApiPost).toHaveBeenCalledWith({
      endpoint: "drops/test-drop/reaction",
      body: { reaction: ":gm:" },
      errorMode: "structured",
    });

    // Click button again to decrement
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("2");
    });
    expect(commonApi.commonApiDelete).toHaveBeenCalledWith({
      endpoint: "drops/test-drop/reaction",
      errorMode: "structured",
    });
  });

  it("updates cached notification drops when removing a chip reaction", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    const drop = createMockDrop({
      context_profile_context: { reaction: ":gm:" },
      reactions: [
        {
          reaction: ":gm:",
          count: 1,
          profiles: [{ handle: "alice", id: "profile-1" }],
        },
      ],
    }) as ApiDrop;
    const notificationQuery: MockNotificationQuery = {
      queryKey: [AppQueryKey.IDENTITY_NOTIFICATIONS, { identity: "alice" }],
      state: {
        data: {
          pages: [
            {
              notifications: [
                {
                  id: 1,
                  related_drops: [drop],
                },
              ],
            },
          ],
          pageParams: [null],
        },
      },
    };
    mockQueryCacheFindAll.mockImplementation(
      ({
        predicate,
      }: {
        readonly predicate: (query: MockNotificationQuery) => boolean;
      }) => [notificationQuery].filter((query) => predicate(query))
    );
    (commonApi.commonApiDelete as jest.Mock).mockResolvedValueOnce({});

    render(<WaveDropReactions drop={drop} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(commonApi.commonApiDelete).toHaveBeenCalledWith({
        endpoint: "drops/test-drop/reaction",
        errorMode: "structured",
      });
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      notificationQuery.queryKey,
      expect.objectContaining({
        pages: [
          {
            notifications: [
              expect.objectContaining({
                related_drops: [
                  expect.objectContaining({
                    id: "test-drop",
                    context_profile_context: expect.objectContaining({
                      reaction: null,
                    }),
                    reactions: [],
                  }),
                ],
              }),
            ],
          },
        ],
      })
    );
  });

  it("shows the structured API error message when a chip reaction fails", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: JSON.stringify({ message: "Unauthorized" }),
        message: "unexpected raw error",
      })
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(setToastMock).toHaveBeenCalledWith({
        message: "Unauthorized",
        type: "error",
      });
    });
  });

  it("shows rate-limit guidance and rolls back chip state after a 429", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    const request = createDeferred<unknown>();
    (commonApi.commonApiPost as jest.Mock).mockReturnValueOnce(request.promise);

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                count: 1,
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("1");

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent("2");
    });

    await act(async () => {
      request.reject(
        createStructuredReactionError({
          body: JSON.stringify({ error: "Rate limit exceeded" }),
          headers: new Headers({ "retry-after": "2" }),
          message: "Rate limit exceeded",
          status: 429,
          statusText: "Too Many Requests",
        })
      );
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(setToastMock).toHaveBeenCalledWith({
        message: "You are reacting too quickly. Try again in 2 seconds.",
        type: "error",
      });
    });
    expect(button).toHaveTextContent("1");
  });

  it("ignores a stale chip failure after a newer click", async () => {
    const firstRollback = jest.fn();
    const secondRollback = jest.fn();
    getMyStreamMock().mockReturnValue({
      applyOptimisticDropUpdate: jest
        .fn()
        .mockReturnValueOnce({ rollback: firstRollback })
        .mockReturnValueOnce({ rollback: secondRollback }),
    });
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    const firstRequest = createDeferred<unknown>();
    const secondRequest = createDeferred<unknown>();
    (commonApi.commonApiPost as jest.Mock).mockReturnValueOnce(
      firstRequest.promise
    );
    (commonApi.commonApiDelete as jest.Mock).mockReturnValueOnce(
      secondRequest.promise
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "user1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("1");

    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("2");
    });

    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("1");
    });
    expect(firstRollback).not.toHaveBeenCalled();
    expect(secondRollback).not.toHaveBeenCalled();

    await act(async () => {
      firstRequest.reject(new Error("first request failed"));
      await Promise.resolve();
    });

    expect(button).toHaveTextContent("1");
    expect(setToastMock).not.toHaveBeenCalled();
    expect(firstRollback).not.toHaveBeenCalled();
    expect(secondRollback).not.toHaveBeenCalled();

    await act(async () => {
      secondRequest.reject(new Error("second request failed"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(button).toHaveTextContent("2");
    });
    expect(setToastMock).toHaveBeenCalledWith({
      message: "second request failed",
      type: "error",
    });
    expect(secondRollback).toHaveBeenCalledTimes(1);
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("test-drop");
  });

  it("does not let a stale chip success clear the newer rollback", async () => {
    const firstRollback = jest.fn();
    const secondRollback = jest.fn();
    getMyStreamMock().mockReturnValue({
      applyOptimisticDropUpdate: jest
        .fn()
        .mockReturnValueOnce({ rollback: firstRollback })
        .mockReturnValueOnce({ rollback: secondRollback }),
    });
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    const firstRequest = createDeferred<unknown>();
    const secondRequest = createDeferred<unknown>();
    (commonApi.commonApiPost as jest.Mock).mockReturnValueOnce(
      firstRequest.promise
    );
    (commonApi.commonApiDelete as jest.Mock).mockReturnValueOnce(
      secondRequest.promise
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "user1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("2");
    });

    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("1");
    });

    await act(async () => {
      firstRequest.resolve({});
      await Promise.resolve();
    });

    expect(button).toHaveTextContent("1");
    expect(secondRollback).not.toHaveBeenCalled();

    await act(async () => {
      secondRequest.reject(new Error("second request failed"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(button).toHaveTextContent("2");
    });
    expect(secondRollback).toHaveBeenCalledTimes(1);
  });

  it("uses draft state when replacing one optimistic chip with another", async () => {
    let secondDraft: any = null;
    const applyOptimisticDropUpdate = jest.fn(({ update }) => {
      if (applyOptimisticDropUpdate.mock.calls.length === 2) {
        const draft = {
          id: "test-drop",
          wave: { id: "test-wave" },
          type: DropSize.FULL,
          stableKey: "test-drop",
          stableHash: "test-drop",
          context_profile_context: { reaction: ":gm:" },
          reactions: [
            {
              reaction: ":gm:",
              count: 2,
              profiles: [
                { id: "profile-1", handle: "alice" },
                { id: "profile-2", handle: "bob" },
              ],
            },
            {
              reaction: ":wave:",
              count: 1,
              profiles: [{ id: "profile-3", handle: "carol" }],
            },
          ],
        };
        update(draft);
        secondDraft = draft;
      }

      return { rollback: jest.fn() };
    });

    getMyStreamMock().mockReturnValue({ applyOptimisticDropUpdate });
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [
              { id: "gm", skins: [{ src: "/gm.png" }] },
              { id: "wave", skins: [{ src: "/wave.png" }] },
            ],
          },
        ],
        () => null
      )
    );

    const firstRequest = createDeferred<unknown>();
    const secondRequest = createDeferred<unknown>();
    (commonApi.commonApiPost as jest.Mock)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            context_profile_context: { reaction: null },
            reactions: [
              {
                reaction: ":gm:",
                count: 1,
                profiles: [{ handle: "user1", id: "1" }],
              },
              {
                reaction: ":wave:",
                count: 1,
                profiles: [{ handle: "user2", id: "2" }],
              },
            ],
          }) as any
        }
      />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]!);
    fireEvent.click(buttons[1]!);

    await waitFor(() => {
      expect(applyOptimisticDropUpdate).toHaveBeenCalledTimes(2);
    });

    expect(secondDraft.context_profile_context.reaction).toBe(":wave:");
    const gmReaction = secondDraft.reactions.find(
      (item: any) => item.reaction === ":gm:"
    );
    const waveReaction = secondDraft.reactions.find(
      (item: any) => item.reaction === ":wave:"
    );
    expect(gmReaction.count).toBe(1);
    expect(
      gmReaction.profiles.some((profile: any) => profile.id === "profile-1")
    ).toBe(false);
    expect(waveReaction.count).toBe(2);
    expect(
      waveReaction.profiles.some((profile: any) => profile.id === "profile-1")
    ).toBe(true);
  });

  it("shows the safe status-text message when a chip reaction gets an empty structured response", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: "   ",
        message: "   ",
        status: 404,
        statusText: "Not Found",
      })
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(setToastMock).toHaveBeenCalledWith({
        message: "Not Found",
        type: "error",
      });
    });
  });

  it("renders reaction pills as non-interactive when disconnected", () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: null,
      setToast: jest.fn(),
    });
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "user1", id: "1" },
                  { handle: "user2", id: "2" },
                  { handle: "user3", id: "3" },
                  { handle: "user4", id: "4" },
                ],
              },
            ],
          }) as any
        }
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-tooltip-id", "reaction-test-drop-gm");
    expect(button).toHaveTextContent("4");

    fireEvent.click(button);

    expect(button).toHaveTextContent("4");
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
    expect(commonApi.commonApiDelete).not.toHaveBeenCalled();
    expect(screen.queryByText("Reactions")).not.toBeInTheDocument();
  });

  it("renders reaction pills as non-interactive in proxy mode", () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: { id: "profile-1", handle: "alice" },
      activeProfileProxy: { id: "proxy-1" },
      setToast: setToastMock,
    });
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "user1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
    expect(commonApi.commonApiDelete).not.toHaveBeenCalled();
  });

  it("shows 'and X more' in tooltip when more than 3 profiles", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "user1", id: "1" },
                  { handle: "user2", id: "2" },
                  { handle: "user3", id: "3" },
                  { handle: "user4", id: "4" },
                  { handle: "user5", id: "5" },
                ],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    fireEvent.mouseEnter(reactionButton);

    await waitFor(() => {
      const moreButton = screen.queryByText(/and 2 others/);
      expect(moreButton).toBeInTheDocument();
    });
  });

  it("opens detail dialog when 'and X more' is clicked", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "user1", id: "1" },
                  { handle: "user2", id: "2" },
                  { handle: "user3", id: "3" },
                  { handle: "user4", id: "4" },
                ],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    fireEvent.mouseEnter(reactionButton);

    await waitFor(() => {
      const moreButton = screen.getByText(/and 1 other/);
      fireEvent.click(moreButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Reactions")).toBeInTheDocument();
    });
  });

  it("adds touch handlers for long press on touch devices", () => {
    const mockUseIsTouchDevice = require("@/hooks/useIsTouchDevice").default;
    mockUseIsTouchDevice.mockReturnValue(true);

    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "user1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    expect(reactionButton).toBeInTheDocument();

    mockUseIsTouchDevice.mockReturnValue(false);
  });

  it("renders profile handles as clickable links in tooltip", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "user1", id: "1" },
                  { handle: "user2", id: "2" },
                ],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    fireEvent.mouseEnter(reactionButton);

    await waitFor(() => {
      const user1Link = screen.getByRole("link", { name: "user1" });
      expect(user1Link).toHaveAttribute("href", "/user1");
    });
  });
});
