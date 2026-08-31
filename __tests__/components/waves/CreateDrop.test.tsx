import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DropMutationBody } from "@/components/waves/create-drop-content/drop-submission.types";
import CreateDrop from "@/components/waves/CreateDrop";
import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWave } from "@/hooks/useWave";
import { commonApiPost } from "@/services/api/common-api";
import {
  DropClientDeliveryState,
  DropSize,
} from "@/helpers/waves/drop.helpers";
import { fetchWaveMetadata } from "@/services/api/waves-v2-api";

const mockSetQueryData = jest.fn();
const mockInvalidateQueries = jest.fn(() => Promise.resolve());
const mockProcessDropRemoved = jest.fn();
const mockProcessIncomingDrop = jest.fn();
const mockApplyOptimisticDropUpdate = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
    invalidateQueries: mockInvalidateQueries,
  }),
  useMutation: (options: any) => ({
    mutateAsync: jest.fn(async (variables: any) => {
      try {
        const result = await options.mutationFn(variables);
        options.onSuccess?.(result, variables, undefined);
        return result;
      } catch (error) {
        options.onError?.(error, variables, undefined);
        throw error;
      }
    }),
  }),
}));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  getStructuredApiErrorCode: (error: unknown) => {
    const code = (
      error as {
        readonly response?: { readonly body?: { readonly code?: unknown } };
      }
    ).response?.body?.code;
    return typeof code === "string" ? code : undefined;
  },
  getStructuredApiErrorStatus: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : undefined,
}));
jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWaveMetadata: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    applyOptimisticDropUpdate: mockApplyOptimisticDropUpdate,
    processDropRemoved: mockProcessDropRemoved,
    processIncomingDrop: mockProcessIncomingDrop,
  }),
}));
jest.mock("@/components/waves/CreateDropStormParts", () => () => (
  <div data-testid="storm" />
));
const PREFILL_URL =
  "https://opensea.io/item/ethereum/0x1234567890abcdef1234567890abcdef12345678/123";

jest.mock("@/components/waves/CreateDropContent", () => (props: any) => (
  <div>
    <div data-testid="submission-experience">{props.submissionExperience}</div>
    <div data-testid="slow-mode-blocked">
      {String(props.isChatBlockedBySlowMode)}
    </div>
    <div data-testid="is-drop-mode">{String(props.isDropMode)}</div>
    <button
      onClick={() =>
        props.submitDrop({
          drop: {
            wave_id: props.wave.id,
            drop_type: props.isDropMode ? "PARTICIPATORY" : "CHAT",
            title: null,
            parts: [
              {
                content: props.isDropMode
                  ? "Participation drop"
                  : "Chat message",
                media: [],
                quoted_drop: null,
              },
            ],
            referenced_nfts: [],
            mentioned_users: [],
            mentioned_waves: [],
            metadata: [],
            signature: null,
            is_safe_signature: false,
            signer_address: "",
          },
          dropId: null,
        } as DropMutationBody)
      }
    >
      submit current mode
    </button>
    <button
      onClick={() =>
        props.submitDrop({
          drop: {
            wave_id: props.wave.id,
            drop_type: props.isDropMode ? "PARTICIPATORY" : "CHAT",
            parts: [
              {
                content: "Moderation test message",
                media: [],
                quoted_drop: null,
              },
            ],
          },
          dropId: "temp-rejected-drop",
        } as unknown as DropMutationBody)
      }
    >
      submit optimistic drop
    </button>
    <button
      onClick={() =>
        props.onSwitchToDropModeWithUrl(
          "https://opensea.io/item/ethereum/0x1234567890abcdef1234567890abcdef12345678/123"
        )
      }
    >
      switch to drop
    </button>
    <button onClick={() => props.onDropModeChange(false)}>
      switch to chat
    </button>
  </div>
));
jest.mock("@/components/waves/CreateCurationDropContent", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <button
        onClick={() =>
          props.submitDrop({
            drop: { wave_id: props.wave.id, drop_type: "PARTICIPATORY" },
            dropId: null,
          } as DropMutationBody)
        }
      >
        submit curation
      </button>
      <div data-testid="initial-url">{props.initialUrl ?? ""}</div>
    </div>
  ),
}));
jest.mock("@/components/waves/quorum/QuorumProposalDropModal", () => ({
  __esModule: true,
  default: (props: any) =>
    props.isOpen ? (
      <div data-testid="quorum-modal">
        <button onClick={props.onClose}>close quorum</button>
        <button
          onClick={() =>
            props.submitDrop({
              drop: {
                wave_id: props.wave.id,
                drop_type: "PARTICIPATORY",
                title: null,
                parts: [
                  {
                    content: "Participation drop",
                    media: [],
                    quoted_drop: null,
                  },
                ],
                referenced_nfts: [],
                mentioned_users: [],
                mentioned_waves: [],
                metadata: [],
                signature: null,
                is_safe_signature: false,
                signer_address: "",
              },
              dropId: null,
            } as DropMutationBody)
          }
        >
          submit quorum
        </button>
      </div>
    ) : null,
}));

const useWaveMock = useWave as jest.MockedFunction<typeof useWave>;
const commonApiPostMock = commonApiPost as jest.Mock;
const fetchWaveMetadataMock = jest.mocked(fetchWaveMetadata);

const wave = {
  id: "1",
  author: { handle: "creator" },
  wave: { authenticated_user_eligible_for_admin: false },
  chat: { authenticated_user_eligible: true },
  participation: { authenticated_user_eligible: true },
  metrics: {
    your_drops_count: 0,
    your_participation_drops_count: 0,
  },
} as any;

type PendingPost = {
  readonly body: { readonly wave_id: string; readonly drop_type?: string };
  readonly resolve: (drop: unknown) => void;
  readonly reject: (error: unknown) => void;
};

const mockPendingPosts = () => {
  const posts: PendingPost[] = [];
  commonApiPostMock.mockImplementation(
    ({ body }: { body: PendingPost["body"] }) =>
      new Promise((resolve, reject) => {
        posts.push({ body, resolve, reject });
      })
  );
  return posts;
};

describe("CreateDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyOptimisticDropUpdate.mockReturnValue(null);
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
    } as any);
    commonApiPostMock.mockResolvedValue({ id: "server-drop", wave_id: "1" });
    fetchWaveMetadataMock.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("processes queued drop and calls mutation", async () => {
    const onDropAdded = jest.fn();
    const waitAndInvalidateDrops = jest.fn();
    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider value={{ waitAndInvalidateDrops }}>
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={onDropAdded}
            wave={wave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit current mode"));

    await waitFor(() => expect(onDropAdded).toHaveBeenCalled());
    await waitFor(() => expect(waitAndInvalidateDrops).toHaveBeenCalled());
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
  });

  it("keeps a moderation-rejected optimistic drop until the wave is left", async () => {
    const setToast = jest.fn();
    let locallyUpdatedDrop: Record<string, unknown> | undefined;
    mockApplyOptimisticDropUpdate.mockImplementation(({ update }) => {
      locallyUpdatedDrop = update({
        id: "temp-rejected-drop",
        type: DropSize.FULL,
      });
      return { rollback: jest.fn() };
    });
    commonApiPostMock.mockRejectedValue({
      status: 422,
      response: {
        body: {
          code: "CONTENT_MODERATION_REJECTED",
          message: "Blocked by safety check",
        },
      },
    });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { unmount } = render(
      <AuthContext.Provider value={{ setToast } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit optimistic drop"));

    await waitFor(() => {
      expect(mockApplyOptimisticDropUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          waveId: "1",
          dropId: "temp-rejected-drop",
        })
      );
    });
    expect(locallyUpdatedDrop).toEqual(
      expect.objectContaining({
        clientDeliveryState: DropClientDeliveryState.MODERATION_REJECTED,
      })
    );
    expect(mockProcessDropRemoved).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Couldn't submit this drop.",
      })
    );

    unmount();

    expect(mockProcessDropRemoved).toHaveBeenCalledWith(
      "1",
      "temp-rejected-drop"
    );
    consoleErrorSpy.mockRestore();
  });

  it("accepts the next post after a moderation rejection", async () => {
    const setToast = jest.fn();
    commonApiPostMock
      .mockRejectedValueOnce({
        status: 422,
        response: {
          body: {
            code: "CONTENT_MODERATION_REJECTED",
            message: "Blocked by safety check",
          },
        },
      })
      .mockResolvedValueOnce({ id: "server-drop", wave_id: "1" });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={{
              ...wave,
              metrics: { ...wave.metrics, your_drops_count: 1 },
            }}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit optimistic drop"));
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't submit this drop.",
        })
      )
    );

    await userEvent.click(screen.getByText("submit optimistic drop"));
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(2));
    expect(commonApiPostMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        endpoint: "drops",
      })
    );
    consoleErrorSpy.mockRestore();
  });

  it("updates posting access immediately after a suspended-profile rejection", async () => {
    const setToast = jest.fn();
    commonApiPostMock.mockRejectedValue({
      status: 403,
      response: {
        body: {
          code: "PROFILE_SUSPENDED",
          message: "This profile is currently suspended from posting.",
        },
      },
    });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { id: "profile-1", handle: "viewer" },
            setToast,
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={{
              ...wave,
              metrics: { ...wave.metrics, your_drops_count: 1 },
            }}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit current mode"));

    await waitFor(() =>
      expect(mockSetQueryData).toHaveBeenCalledWith(
        [
          QueryKey.CONTENT_MODERATION_REPORTS,
          "public-profile-status",
          "profile-1",
        ],
        { profile_id: "profile-1", status: "SUSPENDED" }
      )
    );
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Profile suspended",
        type: "error",
      })
    );
    consoleErrorSpy.mockRestore();
  });

  it("gates a first chat message on guidelines until the user agrees", async () => {
    fetchWaveMetadataMock.mockResolvedValue([
      {
        id: 1,
        data_key: "wave_display.rules.custom",
        data_value: "Be thoughtful and stay on topic.",
      },
    ]);
    const guidelinesWave = {
      ...wave,
      metrics: {
        your_drops_count: 0,
        your_participation_drops_count: 0,
      },
    } as any;

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { id: "profile-1" },
            setToast: jest.fn(),
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={guidelinesWave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText("submit current mode"));
    fireEvent.click(screen.getByText("submit current mode"));
    expect(
      await screen.findByRole("dialog", { name: "Wave guidelines" })
    ).toBeVisible();
    expect(commonApiPostMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(commonApiPostMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("submit current mode"));
    expect(
      await screen.findByRole("dialog", { name: "Wave guidelines" })
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Agree" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByRole("dialog", { name: "Wave guidelines" })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("submit current mode"));
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(2));
    expect(fetchWaveMetadataMock).toHaveBeenCalledTimes(2);
  });

  it("keeps a first message when current guidelines cannot be loaded", async () => {
    const setToast = jest.fn();
    fetchWaveMetadataMock.mockRejectedValue(new Error("network unavailable"));

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { id: "profile-1" },
            setToast,
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit current mode"));

    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith({
        type: "error",
        title: "Couldn't load the wave guidelines.",
        description: "Please try again before sending your message.",
      })
    );
    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks again when slow mode rejects the enqueue after agreement", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    const slowWave = {
      ...wave,
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };
    const renderComposer = (profileId: string, handle: string) => (
      <AuthContext.Provider
        value={
          {
            connectedProfile: { id: profileId, handle },
            setToast: jest.fn(),
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={slowWave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const { rerender } = render(renderComposer("profile-a", "viewer-a"));
    await userEvent.click(screen.getByText("submit current mode"));
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalledTimes(1));

    fetchWaveMetadataMock.mockResolvedValue([
      {
        id: 1,
        data_key: "wave_display.rules.custom",
        data_value: "Be thoughtful and stay on topic.",
      },
    ]);
    rerender(renderComposer("profile-b", "viewer-b"));

    await userEvent.click(screen.getByText("submit current mode"));
    expect(
      await screen.findByRole("dialog", { name: "Wave guidelines" })
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Agree" }));

    expect(commonApiPostMock).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText("submit current mode"));
    expect(
      await screen.findByRole("dialog", { name: "Wave guidelines" })
    ).toBeVisible();
    expect(fetchWaveMetadataMock).toHaveBeenCalledTimes(3);
    dateNowSpy.mockRestore();
  });

  it("waits for onServerDropCreated before reporting all drops added", async () => {
    const waitAndInvalidateDrops = jest.fn();
    const onAllDropsAdded = jest.fn();
    let resolveServerDropCreated: (() => void) | null = null;
    const onServerDropCreated = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveServerDropCreated = resolve;
        })
    );

    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider value={{ waitAndInvalidateDrops }}>
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            onAllDropsAdded={onAllDropsAdded}
            onServerDropCreated={onServerDropCreated}
            wave={wave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit current mode"));

    await waitFor(() =>
      expect(onServerDropCreated).toHaveBeenCalledWith({
        id: "server-drop",
        wave_id: "1",
      })
    );
    expect(onAllDropsAdded).not.toHaveBeenCalled();

    await act(async () => {
      resolveServerDropCreated?.();
    });

    await waitFor(() => expect(onAllDropsAdded).toHaveBeenCalledTimes(1));
  });

  it("does not blur when a chat drop is queued", async () => {
    const blurSpy = jest.spyOn(HTMLElement.prototype, "blur");
    try {
      render(
        <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
          <ReactQueryWrapperContext.Provider
            value={{ waitAndInvalidateDrops: jest.fn() } as any}
          >
            <CreateDrop
              activeDrop={null}
              onCancelReplyQuote={() => {}}
              onDropAddedToQueue={jest.fn()}
              wave={wave}
              dropId={null}
              fixedDropMode={"CHAT" as any}
              privileges={{ chatRestriction: null } as any}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByText("submit current mode"));

      await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
      expect(blurSpy).not.toHaveBeenCalled();
    } finally {
      blurSpy.mockRestore();
    }
  });

  it("keeps blur behavior when a participatory drop is queued", async () => {
    const blurSpy = jest.spyOn(HTMLElement.prototype, "blur");
    try {
      render(
        <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
          <ReactQueryWrapperContext.Provider
            value={{ waitAndInvalidateDrops: jest.fn() } as any}
          >
            <CreateDrop
              activeDrop={null}
              onCancelReplyQuote={() => {}}
              onDropAddedToQueue={jest.fn()}
              wave={wave}
              dropId={null}
              fixedDropMode={"PARTICIPATION" as any}
              privileges={{ chatRestriction: null } as any}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByText("submit current mode"));

      await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
      expect(blurSpy).toHaveBeenCalled();
    } finally {
      blurSpy.mockRestore();
    }
  });

  it("starts local slow mode cooldown after a chat drop", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    const slowWave = {
      ...wave,
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };

    render(
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={slowWave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit current mode"));

    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalled());
    const updateWave = mockSetQueryData.mock.calls[0][1] as (
      currentWave: typeof slowWave
    ) => typeof slowWave;
    expect(updateWave(slowWave).chat.next_drop_allowed).toBe(40_000);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "1" }],
    });
    dateNowSpy.mockRestore();
  });

  it("queues only one slow-mode chat request while the first request is pending", async () => {
    let resolvePost: ((drop: unknown) => void) | null = null;
    commonApiPostMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        })
    );
    const onDropAdded = jest.fn();

    render(
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={onDropAdded}
            wave={{
              ...wave,
              chat: {
                ...wave.chat,
                slow_mode_cooldown_ms: 30_000,
              },
            }}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit current mode"));
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByText("submit current mode"));

    expect(onDropAdded).toHaveBeenCalledTimes(1);
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);

    resolvePost?.({ id: "server-drop", wave_id: "1" });
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalled());
  });

  it("allows a slow-mode chat submit in another wave while the first wave request is pending", async () => {
    const resolvePosts: Array<(drop: unknown) => void> = [];
    commonApiPostMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePosts.push(resolve);
        })
    );
    const onDropAdded = jest.fn();
    const slowWaveA = {
      ...wave,
      id: "1",
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };
    const slowWaveB = {
      ...wave,
      id: "2",
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };
    const renderComposer = (currentWave: typeof wave) => (
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={onDropAdded}
            wave={currentWave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const { rerender } = render(renderComposer(slowWaveA));

    await userEvent.click(screen.getByText("submit current mode"));
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(1));

    rerender(renderComposer(slowWaveB));
    await userEvent.click(screen.getByText("submit current mode"));

    expect(onDropAdded).toHaveBeenCalledTimes(2);
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);

    resolvePosts[0]?.({ id: "server-drop-a", wave_id: "1" });
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalled());
    expect(mockSetQueryData.mock.calls[0][0]).toEqual([
      QueryKey.WAVE,
      { wave_id: "1" },
    ]);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "1" }],
    });

    resolvePosts[1]?.({ id: "server-drop-b", wave_id: "2" });
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalledTimes(2));
    expect(mockSetQueryData.mock.calls[1][0]).toEqual([
      QueryKey.WAVE,
      { wave_id: "2" },
    ]);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "2" }],
    });
  });

  it("allows a slow-mode chat submit in another wave after the first wave starts cooldown", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    commonApiPostMock.mockImplementation(
      ({ body }: { body: { wave_id: string } }) =>
        Promise.resolve({
          id: `server-drop-${body.wave_id}`,
          wave_id: body.wave_id,
        })
    );
    const onDropAdded = jest.fn();
    const slowWaveA = {
      ...wave,
      id: "1",
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };
    const slowWaveB = {
      ...wave,
      id: "2",
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };
    const renderComposer = (currentWave: typeof wave) => (
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={onDropAdded}
            wave={currentWave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const { rerender } = render(renderComposer(slowWaveA));

    await userEvent.click(screen.getByText("submit current mode"));
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalled());
    expect(onDropAdded).toHaveBeenCalledTimes(1);

    rerender(renderComposer(slowWaveB));
    await userEvent.click(screen.getByText("submit current mode"));

    expect(onDropAdded).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(2));
    dateNowSpy.mockRestore();
  });

  it("does not start slow mode cooldown for participatory drops", async () => {
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);

    render(
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={{
              ...wave,
              chat: {
                ...wave.chat,
                slow_mode_cooldown_ms: 30_000,
              },
            }}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{ chatRestriction: "SLOW_MODE" } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit curation"));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(mockSetQueryData).not.toHaveBeenCalled();
  });

  it("keeps a queued slow-mode chat reservation after a participatory drop succeeds", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    const posts = mockPendingPosts();
    const onDropAdded = jest.fn();
    const slowWave = {
      ...wave,
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };

    render(
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={onDropAdded}
            wave={slowWave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("switch to drop"));
    await waitFor(() =>
      expect(screen.getByTestId("is-drop-mode")).toHaveTextContent("true")
    );
    await userEvent.click(screen.getByText("submit current mode"));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.body.drop_type).toBe("PARTICIPATORY");

    await userEvent.click(screen.getByText("switch to chat"));
    await waitFor(() =>
      expect(screen.getByTestId("is-drop-mode")).toHaveTextContent("false")
    );
    await userEvent.click(screen.getByText("submit current mode"));

    expect(onDropAdded).toHaveBeenCalledTimes(2);
    expect(posts).toHaveLength(1);

    posts[0]?.resolve({ id: "server-participatory", wave_id: "1" });
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1]?.body.drop_type).toBe("CHAT");
    expect(mockSetQueryData).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("submit current mode"));
    expect(onDropAdded).toHaveBeenCalledTimes(2);
    expect(posts).toHaveLength(2);

    posts[1]?.resolve({ id: "server-chat", wave_id: "1" });
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalledTimes(1));
    const updateWave = mockSetQueryData.mock.calls[0][1] as (
      currentWave: typeof slowWave
    ) => typeof slowWave;
    expect(updateWave(slowWave).chat.next_drop_allowed).toBe(40_000);
    dateNowSpy.mockRestore();
  });

  it("keeps a queued slow-mode chat reservation after a participatory drop fails", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    const posts = mockPendingPosts();
    const onDropAdded = jest.fn();
    const slowWave = {
      ...wave,
      chat: {
        ...wave.chat,
        slow_mode_cooldown_ms: 30_000,
      },
    };

    render(
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={onDropAdded}
            wave={slowWave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("switch to drop"));
    await waitFor(() =>
      expect(screen.getByTestId("is-drop-mode")).toHaveTextContent("true")
    );
    await userEvent.click(screen.getByText("submit current mode"));

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.body.drop_type).toBe("PARTICIPATORY");

    await userEvent.click(screen.getByText("switch to chat"));
    await waitFor(() =>
      expect(screen.getByTestId("is-drop-mode")).toHaveTextContent("false")
    );
    await userEvent.click(screen.getByText("submit current mode"));

    expect(onDropAdded).toHaveBeenCalledTimes(2);
    expect(posts).toHaveLength(1);

    posts[0]?.reject(new Error("participatory failed"));
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1]?.body.drop_type).toBe("CHAT");
    expect(mockSetQueryData).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("submit current mode"));
    expect(onDropAdded).toHaveBeenCalledTimes(2);
    expect(posts).toHaveLength(2);

    posts[1]?.resolve({ id: "server-chat", wave_id: "1" });
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalledTimes(1));
    const updateWave = mockSetQueryData.mock.calls[0][1] as (
      currentWave: typeof slowWave
    ) => typeof slowWave;
    expect(updateWave(slowWave).chat.next_drop_allowed).toBe(40_000);
    dateNowSpy.mockRestore();
  });

  it("does not reuse chat slow-mode state for participatory drops", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);
    commonApiPostMock.mockImplementation(
      ({ body }: { body: { drop_type: string; wave_id: string } }) =>
        Promise.resolve({
          id: `server-drop-${body.drop_type}`,
          wave_id: body.wave_id,
        })
    );

    render(
      <AuthContext.Provider
        value={
          {
            setToast: jest.fn(),
            connectedProfile: { handle: "viewer" },
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={{
              ...wave,
              chat: {
                ...wave.chat,
                slow_mode_cooldown_ms: 30_000,
              },
            }}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{ chatRestriction: null } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit current mode"));
    await waitFor(() => expect(mockSetQueryData).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByText("switch to drop"));
    await waitFor(() =>
      expect(screen.getByText("submit curation")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("submit curation"));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(2));
    expect(mockSetQueryData).toHaveBeenCalledTimes(1);
    dateNowSpy.mockRestore();
  });

  it("keeps both-mode composer in chat mode during slow mode cooldown", () => {
    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={{
              ...wave,
              chat: { authenticated_user_eligible: false },
            }}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{ chatRestriction: "SLOW_MODE" } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId("slow-mode-blocked")).toHaveTextContent("true");
    expect(screen.getByTestId("is-drop-mode")).toHaveTextContent("false");
  });

  it("shows success toast for leaderboard curation submissions", async () => {
    const setToast = jest.fn();
    const onAllDropsAdded = jest.fn();
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{} as any}
            curationComposerVariant="leaderboard"
            onAllDropsAdded={onAllDropsAdded}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit curation"));

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith({
        message: "Drop submitted.",
        type: "success",
      });
    });

    await waitFor(() => expect(onAllDropsAdded).toHaveBeenCalledTimes(1));
  });

  it("does not show success toast for non-leaderboard curation submissions", async () => {
    const setToast = jest.fn();
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{} as any}
            curationComposerVariant="default"
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit curation"));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(setToast).not.toHaveBeenCalledWith({
      message: "Drop submitted.",
      type: "success",
    });
  });

  it("can force the standard composer for curation waves", () => {
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);

    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{} as any}
            forceStandardDropComposer={true}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByText("submit current mode")).toBeInTheDocument();
    expect(screen.queryByText("submit curation")).not.toBeInTheDocument();
    expect(screen.getByTestId("submission-experience")).toHaveTextContent(
      "DEFAULT"
    );
  });

  it("switches to curation mode with a prefilled url seed", async () => {
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);

    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("switch to drop"));

    await waitFor(() =>
      expect(screen.getByTestId("initial-url")).toHaveTextContent(PREFILL_URL)
    );
  });

  it("opens external curation submit flow from chat mode with the url seed", async () => {
    const onSubmitCurationUrl = jest.fn();
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);

    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{} as any}
            onSubmitCurationUrl={onSubmitCurationUrl}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("switch to drop"));

    expect(onSubmitCurationUrl).toHaveBeenCalledWith(PREFILL_URL);
    expect(screen.queryByText("submit curation")).not.toBeInTheDocument();
  });

  it("does not open external curation submit flow from chat mode when blocked", async () => {
    const onSubmitCurationUrl = jest.fn();
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);

    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"CHAT" as any}
            privileges={{} as any}
            onSubmitCurationUrl={onSubmitCurationUrl}
            canSubmitCurationUrl={false}
            curationUrlSubmitRestrictionMessage="Submissions are locked."
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("switch to drop"));

    expect(onSubmitCurationUrl).not.toHaveBeenCalled();
    expect(screen.queryByText("submit curation")).not.toBeInTheDocument();
  });

  it("resets to default mode when wave scope changes", async () => {
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
    } as any);
    const nextWave = { ...wave, id: "2" };

    const { rerender } = render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("switch to drop"));
    await waitFor(() =>
      expect(screen.getByText("submit curation")).toBeInTheDocument()
    );

    rerender(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={nextWave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await waitFor(() =>
      expect(screen.getByText("switch to drop")).toBeInTheDocument()
    );
  });

  it("passes identity experience through the generic composer path", () => {
    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={{
              ...wave,
              participation: {
                ...wave.participation,
                submission_strategy: {
                  type: "IDENTITY",
                  config: {
                    who_can_be_submitted: "EVERYONE",
                    duplicates: "NEVER_ALLOW",
                  },
                },
              },
            }}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId("submission-experience")).toHaveTextContent(
      "IDENTITY"
    );
  });

  it("opens quorum proposal modal through the custom proposal experience", () => {
    useWaveMock.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isQuorumWave: true,
    } as any);

    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId("quorum-modal")).toBeInTheDocument();
    expect(
      screen.queryByTestId("submission-experience")
    ).not.toBeInTheDocument();
  });
});
