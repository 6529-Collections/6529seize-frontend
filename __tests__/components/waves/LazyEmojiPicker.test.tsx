import LazyEmojiPicker from "@/components/waves/LazyEmojiPicker";
import { notifyReactionHistoryChange } from "@/helpers/reactions/reactionHistory";
import { fireEvent, render, screen } from "@testing-library/react";

const mockSelection = { id: "smile", native: "😄" };
const mockLoadNativeEmojis = jest.fn().mockResolvedValue({});
const mockLoadCustomEmojis = jest.fn().mockResolvedValue(undefined);
const mockPickerProps = jest.fn();
jest.mock("@/components/waves/prepareEmojiMartData", () => ({
  prepareEmojiMartData: jest.fn(),
}));
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
  default: (props: {
    custom: unknown;
    maxFrequentRows?: number;
    perLine?: number;
    categoryIcons: unknown;
    onEmojiSelect: (emoji: typeof mockSelection) => void;
  }) => {
    mockPickerProps(props);
    const { onEmojiSelect } = props;
    return (
      <button onClick={() => onEmojiSelect(mockSelection)}>Select smile</button>
    );
  },
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

it("uses only supplied assets and disables frequent-history persistence for encrypted chats", async () => {
  jest.clearAllMocks();
  const onEmojiSelect = jest.fn();
  const custom = [{ id: "6529", name: "6529", category: "6529", emojis: [] }];
  render(
    <LazyEmojiPicker
      privateMode
      perLine={7}
      customEmojis={custom}
      onEmojiSelect={onEmojiSelect}
    />
  );
  fireEvent.click(await screen.findByRole("button", { name: "Select smile" }));
  expect(mockLoadCustomEmojis).not.toHaveBeenCalled();
  expect(notifyReactionHistoryChange).not.toHaveBeenCalled();
  expect(mockPickerProps).toHaveBeenLastCalledWith(
    expect.objectContaining({
      custom,
      maxFrequentRows: 0,
      perLine: 7,
      categoryIcons: {},
    })
  );
  expect(onEmojiSelect).toHaveBeenCalledWith(mockSelection);
});
