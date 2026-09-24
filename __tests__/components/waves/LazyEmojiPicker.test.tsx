import LazyEmojiPicker from "@/components/waves/LazyEmojiPicker";
import { notifyReactionHistoryChange } from "@/helpers/reactions/reactionHistory";
import { fireEvent, render, screen } from "@testing-library/react";

const mockSelection = { id: "smile", native: "😄" };
const mockLoadNativeEmojis = jest.fn().mockResolvedValue({});
const mockLoadCustomEmojis = jest.fn().mockResolvedValue(undefined);
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    categories: [],
    categoryIcons: {},
    emojiMap: [],
    emojiData: {},
    loadNativeEmojis: mockLoadNativeEmojis,
    loadCustomEmojis: mockLoadCustomEmojis,
  }),
}));
jest.mock("@/helpers/reactions/reactionHistory", () => ({
  notifyReactionHistoryChange: jest.fn(),
}));
jest.mock("@emoji-mart/react", () => ({
  __esModule: true,
  default: ({
    onEmojiSelect,
  }: {
    onEmojiSelect: (emoji: typeof mockSelection) => void;
  }) => (
    <button onClick={() => onEmojiSelect(mockSelection)}>Select smile</button>
  ),
}));

it("notifies history subscribers once before forwarding the picker selection", async () => {
  const onEmojiSelect = jest.fn();
  render(<LazyEmojiPicker onEmojiSelect={onEmojiSelect} />);
  fireEvent.click(await screen.findByRole("button", { name: "Select smile" }));
  expect(notifyReactionHistoryChange).toHaveBeenCalledTimes(1);
  expect(onEmojiSelect).toHaveBeenCalledTimes(1);
  expect(onEmojiSelect).toHaveBeenCalledWith(mockSelection);
  expect(
    jest.mocked(notifyReactionHistoryChange).mock.invocationCallOrder[0]
  ).toBeLessThan(onEmojiSelect.mock.invocationCallOrder[0]!);
});
