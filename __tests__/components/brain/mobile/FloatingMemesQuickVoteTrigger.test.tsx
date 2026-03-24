import { fireEvent, render, screen } from "@testing-library/react";
import FloatingMemesQuickVoteTrigger from "@/components/brain/mobile/FloatingMemesQuickVoteTrigger";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";

jest.mock("@/hooks/useMemesWaveFooterStats", () => ({
  useMemesWaveFooterStats: jest.fn(),
}));

jest.mock(
  "@/components/brain/left-sidebar/waves/MemesWaveQuickVoteTrigger",
  () => ({
    __esModule: true,
    default: ({
      onOpenQuickVote,
      onPrefetchQuickVote,
      unratedCount,
    }: {
      readonly onOpenQuickVote: () => void;
      readonly onPrefetchQuickVote?: (() => void) | undefined;
      readonly unratedCount: number;
    }) => (
      <button
        type="button"
        data-testid="floating-quick-vote-trigger"
        onClick={onOpenQuickVote}
        onFocus={onPrefetchQuickVote}
        onMouseEnter={onPrefetchQuickVote}
      >
        {unratedCount}
      </button>
    ),
  })
);

const useMemesWaveFooterStatsMock =
  useMemesWaveFooterStats as jest.MockedFunction<
    typeof useMemesWaveFooterStats
  >;

describe("FloatingMemesQuickVoteTrigger", () => {
  const onOpenQuickVote = jest.fn();
  const onPrefetchQuickVote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useMemesWaveFooterStatsMock.mockReturnValue({
      isReady: false,
      uncastPower: null,
      unratedCount: 0,
      votingLabel: null,
    });
  });

  it("stays hidden when footer stats are unavailable", () => {
    render(
      <FloatingMemesQuickVoteTrigger
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    expect(screen.queryByTestId("floating-quick-vote-trigger")).toBeNull();
  });

  it("passes hover and focus prefetch intent through to the floating trigger", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isReady: true,
      uncastPower: 5000,
      unratedCount: 3,
      votingLabel: "TDH",
    });

    render(
      <FloatingMemesQuickVoteTrigger
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    const trigger = screen.getByTestId("floating-quick-vote-trigger");

    fireEvent.mouseEnter(trigger);
    fireEvent.focus(trigger);
    fireEvent.click(trigger);

    expect(onPrefetchQuickVote).toHaveBeenCalledTimes(2);
    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
  });
});
