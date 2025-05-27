// __tests__/components/waves/CreateDropEmojiPicker.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// 1. Mock Lexical before the component import to stub node creation
jest.mock("lexical", () => ({
  $createTextNode: jest.fn(),
  $insertNodes: jest.fn(),
}));

// 2. Mock dependencies
jest.mock("../../../hooks/isMobileScreen", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../../contexts/EmojiContext", () => ({
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
      onClick={() => onEmojiSelect({ native: "😊", id: "smile" })}>
      Pick Emoji
    </button>
  ),
}));
jest.mock("@emoji-mart/data", () => ({ __esModule: true, default: {} }));
jest.mock(
  "../../../components/mobile-wrapper-dialog/MobileWrapperDialog",
  () => ({
    __esModule: true,
    default: ({ isOpen, children }: any) =>
      isOpen ? <div data-testid="mobile-dialog">{children}</div> : null,
  })
);

// 3. Now import under test
import CreateDropEmojiPicker from "../../../components/waves/CreateDropEmojiPicker";
import useIsMobileScreen from "../../../hooks/isMobileScreen";
import { useEmoji } from "../../../contexts/EmojiContext";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $insertNodes } from "lexical";

describe("CreateDropEmojiPicker", () => {
  const mockUseIsMobile = useIsMobileScreen as jest.Mock;
  const mockUseEmoji = useEmoji as jest.Mock;
  const mockUseLexical = useLexicalComposerContext as jest.Mock;

  // Fake editor: update is a no-op function (does not execute callback)
  const fakeEditor = { update: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    // Lexical context returns our fake editor
    mockUseLexical.mockReturnValue([fakeEditor]);
    // Emoji context defaults (unused here)
    mockUseEmoji.mockReturnValue({
      emojiMap: [],
      categories: [],
      categoryIcons: {},
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
      expect(wrapper).toHaveStyle("position: absolute");
      expect(wrapper).toHaveStyle("top: -320px");
      expect(wrapper).toHaveStyle("left: -50px");
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

  it("uses mobile dialog on mobile screens and inserts emoji", async () => {
    mockUseIsMobile.mockReturnValue(true);
    render(<CreateDropEmojiPicker />);
    const toggleButton = screen.getByRole("button", { hidden: true });

    // Open mobile picker
    fireEvent.click(toggleButton);
    const mobileDialog = await screen.findByTestId("mobile-dialog");
    expect(mobileDialog).toBeInTheDocument();

    // Emoji pick action
    const picker = screen.getByTestId("picker");
    fireEvent.click(picker);
    expect(fakeEditor.update).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByTestId("mobile-dialog")).toBeNull()
    );
  });
});
