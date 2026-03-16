import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    isLoading: false,
    isReady: true,
    isVoting: false,
    latestUsedAmount: 250,
    queue: [activeDrop],
    recentAmounts: [250, 500],
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
    expect(screen.getByText("Drop 42")).toBeInTheDocument();
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

    const previewCard = screen.getByText("Drop 42").closest("article");

    expect(previewCard).not.toBeNull();

    fireEvent.touchStart(previewCard!, {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    fireEvent.touchMove(previewCard!, {
      touches: [{ clientX: 120, clientY: 0 }],
    });
    fireEvent.touchEnd(previewCard!);

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
