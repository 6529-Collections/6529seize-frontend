import { fireEvent, render, screen } from "@testing-library/react";
import {
  E2eeComposerEmojiPicker,
  E2eeEmojiPicker,
} from "@/components/e2ee/conversation/E2eeEmojiPicker";
import type { EmojiPickerSelection } from "@/components/waves/LazyEmojiPicker";

let mockFailed = false;
let mockMobile = false;
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => mockMobile,
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Emoji slide panel">
        {children}
      </div>
    ) : null,
}));
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
    privateMode,
  }: {
    onEmojiSelect: (emoji: EmojiPickerSelection) => void;
    privateMode?: boolean;
  }) => (
    <button
      data-private-mode={String(privateMode)}
      onClick={() => onEmojiSelect(mockSelection.value)}
    >
      Choose test emoji
    </button>
  ),
}));

beforeEach(() => {
  mockFailed = false;
  mockMobile = false;
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

it.each([false, true])(
  "uses the regular composer presentation with private emoji handling (mobile=%s)",
  (mobile) => {
    mockMobile = mobile;
    mockSelection.value = { native: "😀" };
    const onSelect = jest.fn();
    const onOpen = jest.fn();
    render(<E2eeComposerEmojiPicker onSelect={onSelect} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: "Add emoji" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    const choice = screen.getByRole("button", { name: "Choose test emoji" });
    expect(choice).toHaveAttribute("data-private-mode", "true");
    expect(screen.queryByText("Choose an emoji")).toBeNull();
    expect(
      screen.queryByRole("dialog", { name: "Emoji slide panel" }) !== null
    ).toBe(mobile);
    fireEvent.click(choice);
    expect(onSelect).toHaveBeenCalledWith("😀");
    expect(
      screen.queryByRole("button", { name: "Choose test emoji" })
    ).toBeNull();
  }
);
