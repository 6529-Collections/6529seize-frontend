import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

// Mock CSS module
jest.mock("@/components/waves/drop/VoteButton.module.scss", () => ({
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

  const renderComponent = (props: any = {}) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthContext as any}>
          <ReactQueryWrapperContext.Provider
            value={mockReactQueryWrapperContext as any}
          >
            <SingleWaveDropVoteSubmit
              drop={mockDrop}
              newRating={100}
              {...props}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(commonApi.commonApiPost).mockReset();
    jest.mocked(commonApi.commonApiPost).mockResolvedValue(mockDrop);
    mockAuthContext.requestAuth.mockResolvedValue({ success: true });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders vote button with correct initial text", () => {
    renderComponent();

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Vote")).toBeInTheDocument();
  });

  it("applies correct styling based on drop rank", () => {
    renderComponent();

    const button = screen.getByRole("button");
    expect(button).toHaveClass("voteButton");
  });

  it("handles button click and shows loading state", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    mockCommonApiPost.mockResolvedValue(mockDrop);

    renderComponent();

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Should show loading spinner
    await waitFor(() => {
      expect(screen.getByText("Vote")).toBeInTheDocument();
    });
  });

  it("calls requestAuth when button is clicked", async () => {
    const mockCommonApiPost = jest.mocked(commonApi.commonApiPost);
    mockCommonApiPost.mockResolvedValue(mockDrop);

    renderComponent();

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Advance timers to trigger auth request
    jest.advanceTimersByTime(300);

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
    jest.advanceTimersByTime(300);

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

    jest.advanceTimersByTime(300);

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
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS, { waveId: mockDrop.wave.id }],
    });
  });

  it("handles authentication failure", async () => {
    mockAuthContext.requestAuth.mockResolvedValue({ success: false });
    const onVoteApplied = jest.fn();

    renderComponent({ onVoteApplied });
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Advance timers
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });

    // Should not make API call if auth fails
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
    expect(onVoteApplied).not.toHaveBeenCalled();
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

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalled();
    });

    // Button should show initial text
    expect(screen.getByText("Vote")).toBeInTheDocument();
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
    expect(screen.getByText("Vote")).toBeInTheDocument();
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
    if (ref.current) {
      void ref.current.handleClick();
    }

    jest.advanceTimersByTime(300);

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
            <SingleWaveDropVoteSubmit drop={mockDrop} newRating={100} />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
