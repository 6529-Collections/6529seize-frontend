import { fireEvent, render, screen } from "@testing-library/react";
import { E2eeEmojiPicker } from "@/components/e2ee/conversation/E2eeEmojiPicker";
import type { EmojiPickerSelection } from "@/components/waves/LazyEmojiPicker";

let mockFailed = false;
const mockRetry = jest.fn();
const mockSelection: { value: EmojiPickerSelection } = {
  value: { native: "😀" },
};
jest.mock("@/components/e2ee/conversation/E2eeEmojiProvider", () => ({
  useE2eeEmojis: () => ({
    categories: [],
    failed: mockFailed,
    retry: mockRetry,
  }),
}));
jest.mock("@/components/waves/LazyEmojiPicker", () => ({
  __esModule: true,
  default: ({
    onEmojiSelect,
  }: {
    onEmojiSelect: (emoji: EmojiPickerSelection) => void;
  }) => (
    <button onClick={() => onEmojiSelect(mockSelection.value)}>
      Choose test emoji
    </button>
  ),
}));

beforeEach(() => {
  mockFailed = false;
  jest.clearAllMocks();
});

it.each([
  { selection: { native: "😀", id: "grinning" }, expected: "😀" },
  { selection: { id: "gm" }, expected: ":gm:" },
  { selection: { id: "x".repeat(63) }, expected: null },
])(
  "sends a compatible emoji value and closes the board: $expected",
  ({ selection, expected }) => {
    mockSelection.value = selection;
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(<E2eeEmojiPicker open onClose={onClose} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose test emoji" }));
    if (expected === null) expect(onSelect).not.toHaveBeenCalled();
    else expect(onSelect).toHaveBeenCalledWith(expected);
    expect(onClose).toHaveBeenCalledTimes(1);
  }
);

it("keeps standard emojis available while a failed custom pack can be retried", () => {
  mockFailed = true;
  mockSelection.value = { native: "😀" };
  const onSelect = jest.fn();
  render(<E2eeEmojiPicker open onClose={jest.fn()} onSelect={onSelect} />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Standard emojis are still available"
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mockRetry).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Choose test emoji" }));
  expect(onSelect).toHaveBeenCalledWith("😀");
});
