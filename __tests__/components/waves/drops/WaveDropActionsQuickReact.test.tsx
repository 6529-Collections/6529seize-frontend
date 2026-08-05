import WaveDropActionsQuickReact from "@/components/waves/drops/WaveDropActionsQuickReact";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropReaction } from "@/hooks/drops/useDropReaction";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/hooks/drops/useDropReaction", () => ({
  useDropReaction: jest.fn(),
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    findNativeEmoji: jest.fn(),
    loadEmojiData: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("@/helpers/reactions/reactionHistory", () => ({
  getReactionSnapshot: () => "snapshot",
  getReactionSnapshotServer: () => "snapshot",
  getTopReactions: () => [":+1:"],
  subscribeToReactionStore: () => () => undefined,
}));

const mockedUseDropReaction = jest.mocked(useDropReaction);
const drop = { id: "drop-1" } as ExtendedDrop;

beforeEach(() => {
  jest.clearAllMocks();
});

it("reports an enabled mobile quick reaction without waiting for the request", () => {
  const react = jest.fn(() => new Promise<void>(() => undefined));
  const onReactionStarted = jest.fn();
  mockedUseDropReaction.mockReturnValue({ canReact: true, react });

  render(
    <WaveDropActionsQuickReact
      drop={drop}
      isMobile
      onReactionStarted={onReactionStarted}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Click to react" }));

  expect(react).toHaveBeenCalledWith(":+1:");
  expect(onReactionStarted).toHaveBeenCalledTimes(1);
  expect(react.mock.invocationCallOrder[0]).toBeLessThan(
    onReactionStarted.mock.invocationCallOrder[0]!
  );
});

it("does nothing when mobile quick reactions are disabled", () => {
  const react = jest.fn();
  const onReactionStarted = jest.fn();
  mockedUseDropReaction.mockReturnValue({ canReact: false, react });

  render(
    <WaveDropActionsQuickReact
      drop={drop}
      isMobile
      onReactionStarted={onReactionStarted}
    />
  );

  const button = screen.getByRole("button", { name: "Click to react" });
  expect(button).toBeDisabled();
  fireEvent.click(button);

  expect(react).not.toHaveBeenCalled();
  expect(onReactionStarted).not.toHaveBeenCalled();
});
