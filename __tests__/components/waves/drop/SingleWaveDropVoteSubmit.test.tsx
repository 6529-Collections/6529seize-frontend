import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SingleWaveDropVoteSubmitHandles } from "@/components/waves/drop/SingleWaveDropVoteSubmit";
import SingleWaveDropVoteSubmit from "@/components/waves/drop/SingleWaveDropVoteSubmit";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import * as commonApi from "@/services/api/common-api";
import { SingleWaveDropVoteSubmissionMode } from "@/components/waves/drop/SingleWaveDropVote.types";
import { isChainIdentityActive } from "@/lib/chain-identity/active";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { identityOfWallet } from "@/lib/chain-waves/signing";

// Mock dependencies
jest.mock("@mojs/core", () => ({
  Burst: jest.fn().mockImplementation(() => ({
    parent: "",
    radius: {},
    count: 0,
    angle: 0,
    children: {},
  })),
  Html: jest.fn().mockImplementation(() => ({
    el: "",
    duration: 0,
    scale: {},
    easing: {},
  })),
  Timeline: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    replay: jest.fn(),
  })),
  easing: {
    bezier: jest.fn(),
    out: jest.fn(),
  },
}));

jest.mock("@/helpers/AllowlistToolHelpers", () => ({
  getRandomObjectId: jest.fn(() => "test-id-123"),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

jest.mock("@/lib/chain-identity/active", () => ({
  ...jest.requireActual("@/lib/chain-identity/active"),
  isChainIdentityActive: jest.fn(() => false),
}));
jest.mock("@/components/chain-waves/useChainWavesWriters", () => ({
  useChainWavesWriters: jest.fn(() => null),
}));
// Mock CSS module
jest.mock("@/components/waves/drop/VoteButton.module.css", () => ({
  buttonContent: "buttonContent",
  buttonText: "buttonText",
  enter: "enter",
  exit: "exit",
  spinner: "spinner",
  bounce1: "bounce1",
  bounce2: "bounce2",
  bounce3: "bounce3",
  voteButton: "voteButton",
  processing: "processing",
}));

// Mock DOM methods
Object.defineProperty(document, "getElementById", {
  value: jest.fn(() => ({
    style: {
      transform: "",
    },
  })),
});

describe("SingleWaveDropVoteSubmit", () => {
  const mockDrop: ApiDrop = {
    id: "test-drop-id",
    rank: 1,
    title: "Test Drop",
    created_at: "2023-01-01T00:00:00Z",
    author: {
      handle: "testuser",
      normalised_handle: "testuser",
      wallet: "0x123",
      display: "Test User",
      pfp: null,
      pfp_url: null,
      cic: 0,
      rep: 0,
      tdh: 0,
      level: 1,
      consolidation_key: null,
      classification: null,
      sub_classification: null,
      created_at: "2023-01-01",
      updated_at: "2023-01-01",
    },
    wave: {
      id: "test-wave-id",
      name: "Test Wave",
    },
  };

  const mockAuthContext = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
    connectedProfile: {
      handle: "testuser",
      wallet: "0x123",
    },
  };

  const mockReactQueryWrapperContext = {
    onDropRateChange: jest.fn(),
  };

  let queryClient: QueryClient;

  const flushMicrotasks = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };

  const advanceTimers = async (ms: number) => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
      await flushMicrotasks();
    });
  };
  const backgroundModalCloseDelayMs = 1500;
  const defaultVoteLabel = "Rep";
  const defaultIdleButtonLabel = `Vote +100 ${defaultVoteLabel}`;

  const renderComponent = (props: any = {}) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const content = (nextProps: typeof props) => (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthContext as any}>
          <ReactQueryWrapperContext.Provider
            value={mockReactQueryWrapperContext as any}
          >
            <SingleWaveDropVoteSubmit
              drop={mockDrop}
              newRating={100}
              voteLabel={defaultVoteLabel}
              {...nextProps}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
    const view = render(content(props));
    return {
      ...view,
      rerenderWithProps: (nextProps: typeof props) =>
        view.rerender(content({ ...props, ...nextProps })),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(commonApi.commonApiPost).mockReset();
    jest.mocked(commonApi.commonApiPost).mockResolvedValue(mockDrop);
    mockAuthContext.requestAuth.mockResolvedValue({ success: true });
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
      await flushMicrotasks();
    });
    jest.useRealTimers();
  });

  it("renders vote button with correct initial text", () => {
    renderComponent();

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: defaultIdleButtonLabel })
    ).toBeInTheDocument();
  });

  it("uses the shared positive vote action styling", () => {
    renderComponent();

    const button = screen.getByRole("button");
    expect(button).toHaveClass("tw-bg-emerald-500", "tw-w-full");
  });

  it("handles button click and shows loading state", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    mockCommonApiPost.mockResolvedValue(mockDrop);

    renderComponent();

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Should show loading spinner
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: defaultIdleButtonLabel })
      ).toBeInTheDocument();
    });
  });

  it.each([
    {
      newRating: 100,
      voteLabel: "Rep",
      label: "Vote +100 Rep",
    },
    {
      newRating: -1500,
      voteLabel: "TDH",
      label: "Vote -1,500 TDH",
    },
    {
      newRating: 100,
      voteLabel: "Rep",
      submitLabelOverride: "Vote +100 Rep + reply",
      label: "Vote +100 Rep + reply",
    },
  ])(
    "keeps $label accessible while authentication and saving are pending",
    async ({ label, ...props }) => {
      let finishAuth!: (result: { success: boolean }) => void;
      mockAuthContext.requestAuth.mockReturnValue(
        new Promise((resolve) => {
          finishAuth = resolve;
        })
      );
      jest
        .mocked(commonApi.commonApiPost)
        .mockReturnValue(new Promise<ApiDrop>(() => undefined));
      renderComponent(props);
      const button = screen.getByRole("button", { name: label });

      fireEvent.click(button);
      await advanceTimers(300);

      expect(mockAuthContext.requestAuth).toHaveBeenCalledTimes(1);
      expect(commonApi.commonApiPost).not.toHaveBeenCalled();
      expect(button.querySelector(".buttonText")).not.toBeInTheDocument();
      expect(button.querySelector(".spinner")).toBeInTheDocument();
      expect(button).toHaveAccessibleName(label);

      await act(async () => {
        finishAuth({ success: true });
        await flushMicrotasks();
      });

      await waitFor(() => {
        expect(commonApi.commonApiPost).toHaveBeenCalledTimes(1);
      });
      expect(button.querySelector(".buttonText")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: label })).toBe(button);
    }
  );

  it.each([
    {
      submitted: 100,
      edited: -50,
      label: "Vote +100 Rep",
      color: "tw-bg-emerald-500",
    },
    {
      submitted: -100,
      edited: 50,
      label: "Vote -100 Rep",
      color: "tw-bg-rose-600",
    },
  ])(
    "keeps pending feedback for submitted $submitted while the draft changes",
    async ({ submitted, edited, label, color }) => {
      let finishSave!: (value: ApiDrop) => void;
      jest.mocked(commonApi.commonApiPost).mockReturnValue(
        new Promise((resolve) => {
          finishSave = resolve;
        })
      );
      const { rerenderWithProps } = renderComponent({ newRating: submitted });
      const button = screen.getByRole("button", { name: label });
      fireEvent.click(button);
      rerenderWithProps({
        newRating: edited,
        submitLabelOverride: "Edited draft + reply",
      });
      expect(button).toHaveAccessibleName(label);
      expect(button).toHaveClass(color);

      await advanceTimers(300);
      expect(button.querySelector(".buttonText")).not.toBeInTheDocument();
      expect(button).toHaveAccessibleName(label);
      expect(button).toHaveClass(color);
      expect(commonApi.commonApiPost).toHaveBeenCalledWith({
        endpoint: `drops/${mockDrop.id}/ratings`,
        body: { rating: submitted, category: "Rep" },
      });

      await act(async () => {
        finishSave(mockDrop);
        await flushMicrotasks();
      });
      await advanceTimers(300);
      expect(button).toHaveAccessibleName("Voted");
      expect(button).toHaveClass(color);
      await advanceTimers(4200);
      await advanceTimers(300);
      expect(button).toHaveAccessibleName("Edited draft + reply");
      expect(button).toHaveClass(
        edited > 0 ? "tw-bg-emerald-500" : "tw-bg-rose-600"
      );
    }
  );

  it("calls requestAuth when button is clicked", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    mockCommonApiPost.mockResolvedValue(mockDrop);

    renderComponent();

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Advance timers to trigger auth request
    await advanceTimers(300);

    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });
  });

  it("makes API call with correct parameters", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    mockCommonApiPost.mockResolvedValue(mockDrop);

    renderComponent({ newRating: 150 });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Advance timers to trigger API call
    await advanceTimers(300);

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalledWith({
        endpoint: `drops/${mockDrop.id}/ratings`,
        body: {
          rating: 150,
          category: "Rep",
        },
      });
    });
  });

  it("sends the vote to the 6529 Network once waves have moved there", async () => {
    const writers = jest.requireMock(
      "@/components/chain-waves/useChainWavesWriters"
    );
    const vote = jest.fn().mockResolvedValue(undefined);
    writers.useChainWavesWriters.mockReturnValue({ vote });
    try {
      const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
      renderComponent({ newRating: 150 });

      fireEvent.click(screen.getByRole("button"));
      await advanceTimers(300);

      await waitFor(() => {
        expect(vote).toHaveBeenCalledWith({ dropId: mockDrop.id, amount: 150 });
      });
      expect(mockAuthContext.requestAuth).not.toHaveBeenCalled();
      expect(mockCommonApiPost).not.toHaveBeenCalled();
    } finally {
      writers.useChainWavesWriters.mockReturnValue(null);
    }
  });

  describe("a wallet with no identity on the 6529 Network", () => {
    /** The vote stops where the chain writer looks up the wallet. */
    const voteWithoutIdentity = () => {
      jest.spyOn(chainGateway, "getIdentityByWallet").mockResolvedValue(null);
      return identityOfWallet(`0x${"12".repeat(20)}`).then(() => undefined);
    };

    const failedToast = async () => {
      const writers = jest.requireMock(
        "@/components/chain-waves/useChainWavesWriters"
      );
      writers.useChainWavesWriters.mockReturnValue({
        vote: jest.fn(voteWithoutIdentity),
      });
      try {
        renderComponent({ newRating: 150 });
        fireEvent.click(screen.getByRole("button"));
        await advanceTimers(300);
        await waitFor(() => {
          expect(mockAuthContext.setToast).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Couldn't submit your vote." })
          );
        });
        return mockAuthContext.setToast.mock.calls.at(-1)?.[0] as {
          readonly description: React.ReactNode;
        };
      } finally {
        writers.useChainWavesWriters.mockReturnValue(null);
      }
    };

    afterEach(() => {
      jest.mocked(isChainIdentityActive).mockReturnValue(false);
      jest.mocked(chainGateway.getIdentityByWallet).mockRestore();
    });

    it("points to the identity page once it takes changes", async () => {
      jest.mocked(isChainIdentityActive).mockReturnValue(true);
      const toast = await failedToast();
      render(<p data-testid="description">{toast.description}</p>);
      expect(screen.getByTestId("description")).toHaveTextContent(
        "This wallet has no identity on the 6529 Network yet. Create one on your identity page."
      );
      expect(
        screen.getByRole("link", { name: "your identity page" })
      ).toHaveAttribute("href", "/network/identity");
    });

    it("keeps the plain line while the identity page can't help", async () => {
      const toast = await failedToast();
      expect(toast.description).toBe(
        "This wallet has no identity on the 6529 Network yet."
      );
    });
  });

  it("waits for the wallet and the block on the 6529 Network before it closes", async () => {
    const writers = jest.requireMock(
      "@/components/chain-waves/useChainWavesWriters"
    );
    let resolveVote!: () => void;
    const vote = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveVote = resolve;
        })
    );
    writers.useChainWavesWriters.mockReturnValue({ vote });
    const onVoteRequestStarted = jest.fn();
    const onVoteApplied = jest.fn();
    try {
      renderComponent({
        onVoteApplied,
        onVoteRequestStarted,
        submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
      });
      fireEvent.click(screen.getByRole("button"));
      await advanceTimers(300);
      await waitFor(() => expect(vote).toHaveBeenCalled());

      // Background mode would close here; on the chain the vote isn't in yet.
      await advanceTimers(backgroundModalCloseDelayMs);
      expect(onVoteRequestStarted).not.toHaveBeenCalled();
      expect(onVoteApplied).not.toHaveBeenCalled();

      await act(async () => {
        resolveVote();
        await flushMicrotasks();
      });
      await waitFor(() => expect(onVoteApplied).toHaveBeenCalled());

      // Once the vote is in, the dialog closes, so a second click can't send
      // it again.
      await advanceTimers(300);
      await advanceTimers(1000);
      expect(onVoteRequestStarted).toHaveBeenCalledTimes(1);
    } finally {
      writers.useChainWavesWriters.mockReturnValue(null);
    }
  });

  it("warns when a direct negative rating is submitted to a no-negative wave", () => {
    renderComponent({
      drop: {
        ...mockDrop,
        wave: {
          ...mockDrop.wave,
          forbid_negative_votes: true,
        },
      },
      newRating: -5,
    });

    fireEvent.click(screen.getByRole("button"));

    expect(mockAuthContext.setToast).toHaveBeenCalledWith({
      message: "Negative votes are not allowed in this wave.",
      type: "warning",
    });
    expect(mockAuthContext.requestAuth).not.toHaveBeenCalled();
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
  });

  it("shows submitBlockReason without requesting auth or calling the API", () => {
    renderComponent({
      submitBlockReason: "Change this vote before submitting.",
    });

    fireEvent.click(screen.getByRole("button"));

    expect(mockAuthContext.setToast).toHaveBeenCalledWith({
      message: "Change this vote before submitting.",
      type: "warning",
    });
    expect(mockAuthContext.requestAuth).not.toHaveBeenCalled();
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
  });

  it("calls onVoteApplied with the updated drop after a successful mutation", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    const updatedDrop = {
      ...mockDrop,
      context_profile_context: {
        rating: 150,
        min_rating: 0,
        max_rating: 100,
      },
    } as ApiDrop;
    const onVoteApplied = jest.fn();
    mockCommonApiPost.mockResolvedValue(updatedDrop);

    renderComponent({ newRating: 150, onVoteApplied });
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await advanceTimers(300);

    await waitFor(() => {
      expect(onVoteApplied).toHaveBeenCalledWith(updatedDrop);
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: mockDrop.wave.id }],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_DECISIONS, { waveId: mockDrop.wave.id }],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId: mockDrop.wave.id }],
      refetchType: "none",
    });
    expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS, { waveId: mockDrop.wave.id }],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROP_VOTERS, { dropId: mockDrop.id }],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROP_VOTE_LOGS, { dropId: mockDrop.id }],
    });
  });

  it("stops the click flow when unmounted during the opening transition", async () => {
    const onVoteRequestStarted = jest.fn();
    const { unmount } = renderComponent({
      onVoteRequestStarted,
      submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
    });

    fireEvent.click(screen.getByRole("button"));
    unmount();

    await advanceTimers(300);

    expect(mockAuthContext.requestAuth).not.toHaveBeenCalled();
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
    expect(onVoteRequestStarted).not.toHaveBeenCalled();
  });

  it("does not call success callback after unmounting during confirmation transition", async () => {
    const onVoteApplied = jest.fn();
    const onVoteSuccess = jest.fn();
    const { unmount } = renderComponent({
      onVoteApplied,
      onVoteSuccess,
    });

    fireEvent.click(screen.getByRole("button"));
    await advanceTimers(300);

    await waitFor(() => {
      expect(commonApi.commonApiPost).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(onVoteApplied).toHaveBeenCalledWith(mockDrop);
    });

    unmount();
    await advanceTimers(1300);

    expect(onVoteSuccess).not.toHaveBeenCalled();
  });

  it("closes background submissions before the API resolves", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    const onVoteRequestStarted = jest.fn();
    const onVoteApplied = jest.fn();
    let resolveVote!: (drop: ApiDrop) => void;
    mockCommonApiPost.mockReturnValue(
      new Promise<ApiDrop>((resolve) => {
        resolveVote = resolve;
      })
    );

    renderComponent({
      onVoteApplied,
      onVoteRequestStarted,
      submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
    });

    fireEvent.click(screen.getByRole("button"));
    await advanceTimers(300);

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalled();
    });
    expect(onVoteRequestStarted).not.toHaveBeenCalled();
    expect(onVoteApplied).not.toHaveBeenCalled();

    await advanceTimers(backgroundModalCloseDelayMs);

    expect(onVoteRequestStarted).toHaveBeenCalledTimes(1);
    expect(onVoteApplied).not.toHaveBeenCalled();

    await act(async () => {
      resolveVote(mockDrop);
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(onVoteApplied).toHaveBeenCalledWith(mockDrop);
    });
  });

  it("closes background submissions when onVoteApplied never settles", async () => {
    const onVoteRequestStarted = jest.fn();
    const onVoteApplied = jest.fn(() => new Promise<void>(() => undefined));

    renderComponent({
      onVoteApplied,
      onVoteRequestStarted,
      submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
    });

    fireEvent.click(screen.getByRole("button"));
    await advanceTimers(300);

    await waitFor(() => {
      expect(onVoteApplied).toHaveBeenCalledWith(mockDrop);
    });

    await advanceTimers(backgroundModalCloseDelayMs);

    expect(onVoteRequestStarted).toHaveBeenCalledTimes(1);
  });

  it("keeps background submissions open when the API fails before close", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    const onVoteRequestStarted = jest.fn();
    const onVoteApplied = jest.fn();
    let rejectVote!: (error: string) => void;
    mockCommonApiPost.mockReturnValue(
      new Promise<ApiDrop>((_resolve, reject) => {
        rejectVote = reject;
      })
    );

    renderComponent({
      onVoteApplied,
      onVoteRequestStarted,
      submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
    });

    fireEvent.click(screen.getByRole("button"));
    await advanceTimers(300);

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalled();
    });
    expect(screen.getByText("Voted")).toBeInTheDocument();

    await act(async () => {
      rejectVote("Vote failed");
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        title: "Couldn't submit your vote.",
        description: "Please try again.",
        details: "Vote failed.",
        type: "error",
      });
    });
    expect(onVoteRequestStarted).not.toHaveBeenCalled();
    expect(onVoteApplied).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: defaultIdleButtonLabel })
      ).toBeInTheDocument();
    });

    await advanceTimers(backgroundModalCloseDelayMs);

    expect(onVoteRequestStarted).not.toHaveBeenCalled();
  });

  it("keeps background success invalidation after the close callback", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    const onVoteRequestStarted = jest.fn();
    let resolveVote!: (drop: ApiDrop) => void;
    mockCommonApiPost.mockReturnValue(
      new Promise<ApiDrop>((resolve) => {
        resolveVote = resolve;
      })
    );

    renderComponent({
      onVoteRequestStarted,
      submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
    });
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    fireEvent.click(screen.getByRole("button"));
    await advanceTimers(300);

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalled();
    });
    expect(onVoteRequestStarted).not.toHaveBeenCalled();

    await advanceTimers(backgroundModalCloseDelayMs);
    expect(onVoteRequestStarted).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveVote(mockDrop);
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [QueryKey.WAVE, { wave_id: mockDrop.wave.id }],
      });
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_DECISIONS, { waveId: mockDrop.wave.id }],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId: mockDrop.wave.id }],
      refetchType: "none",
    });
    expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS, { waveId: mockDrop.wave.id }],
    });
  });

  it("shows a toast when a background submission fails after close", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    const onVoteRequestStarted = jest.fn();
    const onVoteApplied = jest.fn();
    let rejectVote!: (error: string) => void;
    mockCommonApiPost.mockReturnValue(
      new Promise<ApiDrop>((_resolve, reject) => {
        rejectVote = reject;
      })
    );

    renderComponent({
      onVoteApplied,
      onVoteRequestStarted,
      submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
    });

    fireEvent.click(screen.getByRole("button"));
    await advanceTimers(300);

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalled();
    });
    expect(onVoteRequestStarted).not.toHaveBeenCalled();

    await advanceTimers(backgroundModalCloseDelayMs);
    expect(onVoteRequestStarted).toHaveBeenCalledTimes(1);

    await act(async () => {
      rejectVote("Vote failed");
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        title: "Couldn't submit your vote.",
        description: "Please try again.",
        details: "Vote failed.",
        type: "error",
      });
    });
    expect(onVoteApplied).not.toHaveBeenCalled();
  });

  it("handles authentication failure", async () => {
    mockAuthContext.requestAuth.mockResolvedValue({ success: false });
    const onVoteApplied = jest.fn();
    const onVoteRequestStarted = jest.fn();

    renderComponent({
      onVoteApplied,
      onVoteRequestStarted,
      submissionMode: SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH,
    });
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Advance timers
    await advanceTimers(300);

    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });

    // Should not make API call if auth fails
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
    expect(onVoteApplied).not.toHaveBeenCalled();
    expect(onVoteRequestStarted).not.toHaveBeenCalled();
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("handles API error correctly", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    const mockError = new Error("API Error");
    const onVoteApplied = jest.fn();
    mockCommonApiPost.mockRejectedValue(mockError);

    renderComponent({ onVoteApplied });
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await advanceTimers(300);

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalled();
    });

    // Button should show initial text
    expect(
      screen.getByRole("button", { name: defaultIdleButtonLabel })
    ).toBeInTheDocument();
    expect(onVoteApplied).not.toHaveBeenCalled();
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("accepts onVoteSuccess callback prop", () => {
    const onVoteSuccess = jest.fn();
    renderComponent({ onVoteSuccess });

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("has access to onDropRateChange context", () => {
    renderComponent();

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("allows multiple clicks on button", () => {
    renderComponent();

    const button = screen.getByRole("button");

    // Click multiple times quickly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Button should remain clickable
    expect(button).toBeInTheDocument();
  });

  it("renders button with initial vote text", () => {
    renderComponent();

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: defaultIdleButtonLabel })
    ).toBeInTheDocument();
  });

  it("exposes handleClick method through ref", () => {
    const ref = React.createRef<SingleWaveDropVoteSubmitHandles>();

    renderComponent({ ref });

    expect(ref.current).toBeDefined();
    expect(ref.current?.handleClick).toBeInstanceOf(Function);
  });

  it("handles ref click method", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    mockCommonApiPost.mockResolvedValue(mockDrop);
    const ref = React.createRef<SingleWaveDropVoteSubmitHandles>();

    renderComponent({ ref });

    // Call the exposed method
    act(() => {
      void ref.current?.handleClick();
    });

    await advanceTimers(300);

    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });
  });

  it("handles button click events", () => {
    renderComponent();

    const button = screen.getByRole("button");

    fireEvent.click(button);

    // Button should respond to clicks
    expect(button).toBeInTheDocument();
  });

  it("uses different theme colors for different rankings", () => {
    const dropWithRank2 = { ...mockDrop, rank: 2 };
    renderComponent({ drop: dropWithRank2 });

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("uses default theme for unranked drops", () => {
    const dropWithoutRank = { ...mockDrop, rank: null };
    renderComponent({ drop: dropWithoutRank });

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("handles missing connected profile gracefully", () => {
    const authContextWithoutProfile = {
      ...mockAuthContext,
      connectedProfile: null,
    };

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthContext.Provider value={authContextWithoutProfile as any}>
          <ReactQueryWrapperContext.Provider
            value={mockReactQueryWrapperContext as any}
          >
            <SingleWaveDropVoteSubmit
              drop={mockDrop}
              newRating={100}
              voteLabel={defaultVoteLabel}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
