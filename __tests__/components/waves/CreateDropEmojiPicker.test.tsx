// __tests__/components/waves/CreateDropEmojiPicker.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// 1. Mock Lexical before the component import to stub node creation
jest.mock("lexical", () => ({
  $createTextNode: jest.fn(),
  $insertNodes: jest.fn(),
}));

// 2. Mock dependencies
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/contexts/EmojiContext", () => ({
  __esModule: true,
  useEmoji: jest.fn(),
}));
jest.mock("@lexical/react/LexicalComposerContext", () => ({
  __esModule: true,
  useLexicalComposerContext: jest.fn(),
}));
jest.mock("@emoji-mart/react", () => ({
  __esModule: true,
  default: ({ onEmojiSelect }: { onEmojiSelect: (emoji: any) => void }) => (
    <button
      data-testid="picker"
      onClick={() => onEmojiSelect({ native: "😊", id: "smile" })}
    >
      Pick Emoji
    </button>
  ),
}));
jest.mock("@emoji-mart/data", () => ({ __esModule: true, default: {} }));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ isOpen, children, zIndexClassName }: any) =>
    isOpen ? (
      <div data-testid="mobile-dialog" data-z-index-class={zIndexClassName}>
        {children}
      </div>
    ) : null,
}));

// 3. Now import under test
import CreateDropEmojiPicker from "@/components/waves/CreateDropEmojiPicker";
import { CreateDropEmojiPickerLayerProvider } from "@/components/waves/CreateDropEmojiPickerLayerContext";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useEmoji } from "@/contexts/EmojiContext";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $insertNodes } from "lexical";

describe("CreateDropEmojiPicker", () => {
  const mockUseIsMobile = useIsMobileScreen as jest.Mock;
  const mockUseEmoji = useEmoji as jest.Mock;
  const mockUseLexical = useLexicalComposerContext as jest.Mock;

  // Fake editor: update is a no-op function (does not execute callback)
  const fakeEditor = {
    update: jest.fn(),
    focus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Lexical context returns our fake editor
    mockUseLexical.mockReturnValue([fakeEditor]);
    // Emoji context defaults (unused here)
    mockUseEmoji.mockReturnValue({
      emojiMap: [],
      emojiData: {},
      categories: [],
      categoryIcons: {},
      loading: false,
      findNativeEmoji: jest.fn(),
      findCustomEmoji: jest.fn(),
      loadCustomEmojis: jest.fn(() => Promise.resolve([])),
      loadNativeEmojis: jest.fn(() => Promise.resolve({})),
      loadEmojiData: jest.fn(() => Promise.resolve()),
    });
    // Default to desktop
    mockUseIsMobile.mockReturnValue(false);
    // Clear scroll
    window.scrollY = 0;
    window.scrollX = 0;
  });

  it("toggles picker on button click, positions it, and inserts emoji", async () => {
    render(<CreateDropEmojiPicker />);
    // The toggle button is the first button in the component
    const toggleButton = screen.getByRole("button", { hidden: true });

    // Picker should not be in DOM initially
    expect(screen.queryByTestId("picker")).toBeNull();

    // Stub getBoundingClientRect to test positioning logic
    jest.spyOn(toggleButton, "getBoundingClientRect").mockReturnValue({
      top: 100,
      left: 200,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
    } as DOMRect);

    // Open the picker
    fireEvent.click(toggleButton);
    const picker = await screen.findByTestId("picker");
    expect(picker).toBeInTheDocument();

    // The portal wrapper should have updated styles
    const wrapper = picker.parentElement!;
    await waitFor(() => {
      expect(wrapper.style.position).toBe("absolute");
      expect(wrapper.style.top).toBe("-320px");
      expect(wrapper.style.left).toBe("-50px");
      expect(wrapper.style.zIndex).toBe("1000");
    });

    // Select an emoji
    fireEvent.click(picker);
    // update() should be called once
    expect(fakeEditor.update).toHaveBeenCalledTimes(1);
    // Since update is a no-op, we should not see Lexical errors
    // And we can assert the mocks for node creation were not triggered
    expect($createTextNode).not.toHaveBeenCalled();
    expect($insertNodes).not.toHaveBeenCalled();

    // Picker should close after selection
    await waitFor(() => expect(screen.queryByTestId("picker")).toBeNull());
  });

  it("closes picker when clicking outside", async () => {
    render(<CreateDropEmojiPicker />);
    const toggleButton = screen.getByRole("button", { hidden: true });
    fireEvent.click(toggleButton);
    expect(await screen.findByTestId("picker")).toBeInTheDocument();

    // Simulate click outside
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByTestId("picker")).toBeNull());
  });

  it("does not open the picker when disabled", () => {
    render(<CreateDropEmojiPicker disabled />);
    const toggleButton = screen.getByRole("button", { hidden: true });

    fireEvent.click(toggleButton);

    expect(toggleButton).toBeDisabled();
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("shows an unavailable status when native emoji data cannot load", async () => {
    mockUseEmoji.mockReturnValue({
      emojiMap: [],
      emojiData: null,
      categories: [],
      categoryIcons: {},
      loading: false,
      findNativeEmoji: jest.fn(),
      findCustomEmoji: jest.fn(),
      loadCustomEmojis: jest.fn(() => Promise.resolve([])),
      loadNativeEmojis: jest.fn(() => Promise.resolve(null)),
      loadEmojiData: jest.fn(() => Promise.resolve()),
    });

    render(<CreateDropEmojiPicker />);
    const toggleButton = screen.getByRole("button", { hidden: true });

    fireEvent.click(toggleButton);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Emoji picker is unavailable."
      )
    );
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("closes an open picker when disabled and keeps it closed when re-enabled", async () => {
    const { rerender } = render(<CreateDropEmojiPicker />);
    const toggleButton = screen.getByRole("button", { hidden: true });

    fireEvent.click(toggleButton);
    expect(await screen.findByTestId("picker")).toBeInTheDocument();

    rerender(<CreateDropEmojiPicker disabled />);

    await waitFor(() => expect(screen.queryByTestId("picker")).toBeNull());
    expect(screen.getByRole("button", { hidden: true })).toBeDisabled();

    rerender(<CreateDropEmojiPicker />);

    expect(screen.getByRole("button", { hidden: true })).not.toBeDisabled();
    expect(screen.queryByTestId("picker")).toBeNull();
  });

  it("uses mobile dialog on mobile screens and inserts emoji", async () => {
    mockUseIsMobile.mockReturnValue(true);

    // Clear the mock call count before this test
    fakeEditor.update.mockClear();

    render(<CreateDropEmojiPicker />);
    const toggleButton = screen.getByRole("button", { hidden: true });

    // Open mobile picker
    fireEvent.click(toggleButton);
    const mobileDialog = await screen.findByTestId("mobile-dialog");
    expect(mobileDialog).toBeInTheDocument();

    // Emoji pick action
    const picker = await screen.findByTestId("picker");
    fireEvent.click(picker);
    expect(fakeEditor.update).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByTestId("mobile-dialog")).toBeNull()
    );
  });

  it("uses scoped layer values when provided", async () => {
    render(
      <CreateDropEmojiPickerLayerProvider
        desktopZIndex={10000}
        mobileZIndexClassName="tw-z-[10000]"
      >
        <CreateDropEmojiPicker />
      </CreateDropEmojiPickerLayerProvider>
    );
    const toggleButton = screen.getByRole("button", { hidden: true });

    jest.spyOn(toggleButton, "getBoundingClientRect").mockReturnValue({
      top: 100,
      left: 200,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
    } as DOMRect);

    fireEvent.click(toggleButton);
    const picker = await screen.findByTestId("picker");

    await waitFor(() => {
      expect(picker.parentElement!.style.zIndex).toBe("10000");
    });
  });

  it("passes scoped layer values to the mobile dialog", async () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <CreateDropEmojiPickerLayerProvider
        desktopZIndex={10000}
        mobileZIndexClassName="tw-z-[10000]"
      >
        <CreateDropEmojiPicker />
      </CreateDropEmojiPickerLayerProvider>
    );
    const toggleButton = screen.getByRole("button", { hidden: true });

    fireEvent.click(toggleButton);

    expect(await screen.findByTestId("mobile-dialog")).toHaveAttribute(
      "data-z-index-class",
      "tw-z-[10000]"
    );
  });
});
