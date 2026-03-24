import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import MemesQuickVoteDialog from "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";
import useIsMobileScreen from "@/hooks/isMobileScreen";

jest.mock("@/hooks/useMemesQuickVoteQueue", () => ({
  useMemesQuickVoteQueue: jest.fn(),
}));

jest.mock("@/hooks/isMobileScreen", () => jest.fn());

jest.mock("@/components/waves/drops/WaveDropAuthorPfp", () => ({
  __esModule: true,
  default: () => <div data-testid="author-pfp" />,
}));

jest.mock("@/components/waves/drops/time/WaveDropTime", () => ({
  __esModule: true,
  default: () => <span>just now</span>,
}));

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: () => <div data-testid="drop-media" />,
  })
);

const useMemesQuickVoteQueueMock =
  useMemesQuickVoteQueue as jest.MockedFunction<typeof useMemesQuickVoteQueue>;
const useIsMobileScreenMock = useIsMobileScreen as jest.MockedFunction<
  typeof useIsMobileScreen
>;

const createDrop = (serialNo: number) =>
  ({
    id: `drop-${serialNo}`,
    serial_no: serialNo,
    created_at: new Date(serialNo * 1_000).toISOString(),
    context_profile_context: {
      rating: 0,
      max_rating: 5_000,
    },
    wave: {
      id: "wave-1",
      name: "The Memes",
    },
    author: {
      handle: `artist-${serialNo}`,
      primary_address: `0x${serialNo}`,
    },
    metadata: [
      {
        data_key: "title",
        data_value: `Drop ${serialNo}`,
      },
      {
        data_key: "description",
        data_value: `Description ${serialNo}`,
      },
    ],
    parts: [
      {
        media: [
          {
            mime_type: "image/png",
            url: "https://example.com/drop.png",
          },
        ],
      },
    ],
  }) as any;

describe("MemesQuickVoteDialog", () => {
  const activeDrop = createDrop(42);
  const originalShowModal = HTMLDialogElement.prototype.showModal;
  const originalClose = HTMLDialogElement.prototype.close;
  const originalRequestAnimationFrame = global.requestAnimationFrame;

  const createQueueState = (
    overrides: Partial<ReturnType<typeof useMemesQuickVoteQueue>> = {}
  ): ReturnType<typeof useMemesQuickVoteQueue> => ({
    activeDrop,
    hasDiscoveryError: false,
    isExhausted: false,
    isLoading: false,
    isReady: true,
    isVoting: false,
    latestUsedAmount: 250,
    queue: [activeDrop],
    recentAmounts: [250, 500],
    remainingCount: 9,
    retryDiscovery: jest.fn(),
    submitVote: jest.fn().mockResolvedValue(true),
    skipDrop: jest.fn(),
    uncastPower: 5_000,
    votingLabel: "votes",
    ...overrides,
  });

  beforeAll(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: function showModal(this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: function close(this: HTMLDialogElement) {
        this.open = false;
      },
    });
    global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    }) as typeof global.requestAnimationFrame;
  });

  afterAll(() => {
    if (originalShowModal) {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: originalShowModal,
      });
    } else {
      delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>)
        .showModal;
    }

    if (originalClose) {
      Object.defineProperty(HTMLDialogElement.prototype, "close", {
        configurable: true,
        value: originalClose,
      });
    } else {
      delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    }

    global.requestAnimationFrame = originalRequestAnimationFrame;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobileScreenMock.mockReturnValue(false);
    useMemesQuickVoteQueueMock.mockReturnValue(createQueueState());
  });

  it("keeps the active drop visible during background refetches", () => {
    useMemesQuickVoteQueueMock.mockReturnValue(
      createQueueState({ isLoading: true })
    );

    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    expect(screen.queryByText("Loading your queue")).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("quick-vote-preview-mobile-context")).getByText(
        "Drop 42"
      )
    ).toBeInTheDocument();
  });

  it("shows a done state instead of closing when the queue is exhausted", () => {
    useMemesQuickVoteQueueMock.mockReturnValue(
      createQueueState({
        activeDrop: null,
        isExhausted: true,
        isReady: false,
        queue: [],
        remainingCount: 0,
      })
    );

    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    expect(screen.getByText("You are done")).toBeInTheDocument();
    expect(
      screen.getByText("No unrated memes are left in quick vote right now.")
    ).toBeInTheDocument();
  });

  it("shows structural skeletons while the next item is still hydrating", () => {
    useMemesQuickVoteQueueMock.mockReturnValue(
      createQueueState({
        activeDrop: null,
        isReady: false,
        queue: [],
      })
    );

    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    expect(
      screen.getByTestId("quick-vote-loading-skeleton")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("quick-vote-preview-mobile-context")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("quick-vote-controls-desktop-context")
    ).toBeInTheDocument();
  });

  it("shows a retry state when queue discovery fails", () => {
    const retryDiscovery = jest.fn();

    useMemesQuickVoteQueueMock.mockReturnValue(
      createQueueState({
        activeDrop: null,
        hasDiscoveryError: true,
        isReady: false,
        queue: [],
        retryDiscovery,
      })
    );

    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    expect(screen.getByText("Couldn't load your queue")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retryDiscovery).toHaveBeenCalledTimes(1);
  });

  it("removes the dialog header copy while keeping an accessible close button", () => {
    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    expect(screen.queryByText("Memes Wave")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Newest first. Skip keeps a meme for later.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close quick vote" })
    ).toBeInTheDocument();
  });

  it("keeps single-column preview context available even when js reports desktop", () => {
    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    const mobileRemainingPill = within(
      screen.getByTestId("quick-vote-preview-status")
    ).getByText("5,000 votes left");
    const desktopRemainingPill = within(
      screen.getByTestId("quick-vote-controls-desktop-context")
    ).getByText("5,000 votes left");

    expect(mobileRemainingPill).toHaveClass("tw-text-primary-300");
    expect(desktopRemainingPill).toHaveClass("tw-text-primary-300");
    expect(mobileRemainingPill).toBeInTheDocument();
    expect(
      within(screen.getByTestId("quick-vote-preview-mobile-context")).getByText(
        "Drop 42"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("quick-vote-preview-mobile-context")).getByText(
        "Description 42"
      )
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId("quick-vote-controls-desktop-context")
      ).getByText("Drop 42")
    ).toBeInTheDocument();
  });

  it("bottom-aligns the custom amount action row on larger screens", () => {
    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Custom amount",
      })
    );

    const customInput = screen.getByRole("textbox");
    const customActionRow = customInput.closest("label")?.parentElement;
    const voteButton = screen.getByRole("button", { name: "Vote 50" });

    expect(customActionRow).not.toBeNull();
    expect(customActionRow).toHaveClass("sm:tw-items-end");
    expect(voteButton).toHaveClass("tw-shrink-0", "tw-whitespace-nowrap");
  });

  it("seeds the initial custom amount at one percent when no recent amounts exist", () => {
    useMemesQuickVoteQueueMock.mockReturnValue(
      createQueueState({
        latestUsedAmount: null,
        recentAmounts: [],
      })
    );

    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    expect(screen.getByRole("textbox")).toHaveValue("50");
    expect(screen.getByRole("button", { name: "Vote 50" })).toBeInTheDocument();
  });

  it("uses the open custom amount for swipe voting on mobile", async () => {
    useIsMobileScreenMock.mockReturnValue(true);
    const submitVote = jest.fn().mockResolvedValue(true);

    useMemesQuickVoteQueueMock.mockReturnValue(
      createQueueState({ submitVote })
    );

    render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Custom amount",
      })
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "777" },
    });

    expect(
      screen.getByText("Swipe left to skip, right to vote 777 votes")
    ).toBeInTheDocument();

    const previewCard = screen.getByTestId("quick-vote-preview-card");

    fireEvent.touchStart(previewCard, {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    fireEvent.touchMove(previewCard, {
      touches: [{ clientX: 120, clientY: 0 }],
    });
    fireEvent.touchEnd(previewCard);

    await waitFor(() => {
      expect(submitVote).toHaveBeenCalledWith(activeDrop, 777);
    });
    expect(submitVote).not.toHaveBeenCalledWith(activeDrop, 250);
  });

  it("resets dialog-local controls when the session id changes", () => {
    const { rerender } = render(
      <MemesQuickVoteDialog isOpen={true} sessionId={1} onClose={jest.fn()} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Custom amount",
      })
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "777" },
    });

    expect(screen.getByRole("textbox")).toHaveValue("777");

    rerender(
      <MemesQuickVoteDialog isOpen={true} sessionId={2} onClose={jest.fn()} />
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
