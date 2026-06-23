import MemesQuickVoteDialog from "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

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

const createDrop = ({
  serialNo = 42,
  minRating = 0,
  maxRating = 5_000,
}: {
  readonly serialNo?: number;
  readonly minRating?: number;
  readonly maxRating?: number;
} = {}) =>
  ({
    id: `drop-${serialNo}`,
    serial_no: serialNo,
    created_at: new Date(serialNo * 1_000).toISOString(),
    context_profile_context: {
      rating: 0,
      min_rating: minRating,
      max_rating: maxRating,
    },
    wave: {
      id: "wave-1",
      name: "The Memes",
      voting_credit_type: ApiWaveCreditType.Tdh,
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
        content: `content-${serialNo}`,
        media: [
          {
            mime_type: "image/png",
            url: "https://example.com/drop.png",
          },
        ],
      },
    ],
  }) as any;

const createDialogProps = (
  overrides: Partial<React.ComponentProps<typeof MemesQuickVoteDialog>> = {}
): React.ComponentProps<typeof MemesQuickVoteDialog> => ({
  activeDrop: createDrop(),
  hasDiscoveryError: false,
  isExhausted: false,
  isOpen: true,
  isRestartingRound: false,
  latestUsedAmount: 250,
  leftThisRoundCount: 9,
  nextDrop: null,
  onClose: jest.fn(),
  recentAmounts: [250, 500],
  retryDiscovery: jest.fn(),
  sessionId: 1,
  skipDrop: jest.fn().mockResolvedValue(true),
  submitVote: jest.fn().mockResolvedValue(true),
  uncastPower: 5_000,
  unratedCount: 12,
  votingLabel: "votes",
  ...overrides,
});

describe("MemesQuickVoteDialog", () => {
  const originalShowModal = HTMLDialogElement.prototype.showModal;
  const originalClose = HTMLDialogElement.prototype.close;
  const originalRequestAnimationFrame = global.requestAnimationFrame;

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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("accepts and submits a negative custom amount when the drop range allows it", async () => {
    const activeDrop = createDrop({ minRating: -5_000 });
    const submitVote = jest.fn().mockResolvedValue(true);

    render(
      <MemesQuickVoteDialog
        {...createDialogProps({
          activeDrop,
          latestUsedAmount: null,
          recentAmounts: [],
          submitVote,
        })}
      />
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "-250" },
    });
    expect(screen.getByRole("textbox")).toHaveValue("-250");

    fireEvent.click(screen.getByRole("button", { name: "Vote -250" }));
    await act(async () => {
      jest.advanceTimersByTime(650);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(submitVote).toHaveBeenCalledWith(activeDrop, -250);
    });
  });

  it("keeps signed draft values from submitting", async () => {
    const activeDrop = createDrop({ minRating: -5_000 });
    const submitVote = jest.fn().mockResolvedValue(true);

    render(
      <MemesQuickVoteDialog
        {...createDialogProps({
          activeDrop,
          latestUsedAmount: null,
          recentAmounts: [],
          submitVote,
        })}
      />
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "-" },
    });
    expect(screen.getByRole("textbox")).toHaveValue("-");

    fireEvent.click(screen.getByRole("button", { name: "Vote" }));
    await act(async () => {
      jest.advanceTimersByTime(650);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(submitVote).not.toHaveBeenCalled();
    });
  });

  it("renders negative recent amount buttons and submits the signed amount", async () => {
    const activeDrop = createDrop({ minRating: -5_000 });
    const submitVote = jest.fn().mockResolvedValue(true);

    render(
      <MemesQuickVoteDialog
        {...createDialogProps({
          activeDrop,
          latestUsedAmount: -250,
          recentAmounts: [-250, 500],
          submitVote,
        })}
      />
    );

    const negativeButton = screen.getByRole("button", { name: "-250" });
    expect(negativeButton).toHaveClass("tw-text-rose-200");

    fireEvent.click(negativeButton);
    await act(async () => {
      jest.advanceTimersByTime(650);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(submitVote).toHaveBeenCalledWith(activeDrop, -250);
    });
  });

  it("strips a leading minus from custom input on positive-only drops", () => {
    render(
      <MemesQuickVoteDialog
        {...createDialogProps({
          activeDrop: createDrop({ minRating: 0 }),
          latestUsedAmount: null,
          recentAmounts: [],
        })}
      />
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "-250" },
    });

    expect(screen.getByRole("textbox")).toHaveValue("250");
  });
});
