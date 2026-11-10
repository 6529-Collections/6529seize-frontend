// __tests__/components/waves/CreateDropEmojiPicker.test.tsx
import React from "react";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
jest.mock("@/components/waves/prepareEmojiMartData", () => ({
  prepareEmojiMartData: jest.fn(),
}));

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
  default: ({
    onEmojiSelect,
    autoFocus,
  }: {
    onEmojiSelect: (emoji: any) => void;
    autoFocus?: boolean;
  }) => (
    <button
      data-testid="picker"
      data-auto-focus={String(autoFocus)}
      onClick={() => onEmojiSelect({ native: "😊", id: "smile" })}
      // Like Emoji Mart's search field, which stops every key it handles.
      onKeyDown={(event) => event.nativeEvent.stopImmediatePropagation()}
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
import CreateDropEmojiPicker, {
  EmojiPickerControl,
} from "@/components/waves/CreateDropEmojiPicker";
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

    // Search input should be set to auto-focus
    expect(picker).toHaveAttribute("data-auto-focus", "true");

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

  it.each([
    ["desktop", false],
    ["mobile", true],
  ])(
    "closes on Escape from inside the picker and returns focus to the trigger (%s)",
    async (_label, isMobile) => {
      mockUseIsMobile.mockReturnValue(isMobile);
      render(<CreateDropEmojiPicker />);
      const toggleButton = screen.getByRole("button", { hidden: true });
      fireEvent.click(toggleButton);
      const picker = await screen.findByTestId("picker");
      picker.focus();

      fireEvent.keyDown(picker, { key: "Escape" });

      await waitFor(() => expect(screen.queryByTestId("picker")).toBeNull());
      expect(toggleButton).toHaveFocus();
    }
  );

  it("keeps the picker open for Escape that ends an IME composition", async () => {
    render(<CreateDropEmojiPicker />);
    fireEvent.click(screen.getByRole("button", { hidden: true }));
    const picker = await screen.findByTestId("picker");

    fireEvent.keyDown(picker, { key: "Escape", isComposing: true });

    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });

  it("keeps the desktop picker inside the window near its right edge", async () => {
    const OriginalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      private readonly callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }
      observe() {
        // Like the browser: reported outside React's commit.
        queueMicrotask(() =>
          this.callback([], this as unknown as ResizeObserver)
        );
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1280,
    });
    const width = jest
      .spyOn(HTMLElement.prototype, "offsetWidth", "get")
      .mockReturnValue(354);
    try {
      render(<CreateDropEmojiPicker />);
      const toggleButton = screen.getByRole("button", { hidden: true });
      jest.spyOn(toggleButton, "getBoundingClientRect").mockReturnValue({
        top: 600,
        left: 1180,
        width: 31,
        height: 31,
        right: 1211,
        bottom: 631,
      } as DOMRect);
      fireEvent.click(toggleButton);
      const wrapper = (await screen.findByTestId("picker")).parentElement!;
      // At 1180 - 250 = 930 it would end 4px past the window: 1280 - 354 - 8.
      await waitFor(() => expect(wrapper.style.left).toBe("918px"));
      expect(wrapper.style.top).toBe("180px");
    } finally {
      width.mockRestore();
      Reflect.deleteProperty(document.documentElement, "clientWidth");
      globalThis.ResizeObserver = OriginalResizeObserver;
    }
  });

  it("tells the composer once the mobile panel returns focus after a selection", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const onClosedAfterSelect = jest.fn();
    render(
      <EmojiPickerControl
        onEmojiSelect={jest.fn()}
        onClosedAfterSelect={onClosedAfterSelect}
      />
    );
    const trigger = screen.getByRole("button", { hidden: true });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByTestId("picker"));
    await waitFor(() => expect(screen.queryByTestId("picker")).toBeNull());
    expect(onClosedAfterSelect).not.toHaveBeenCalled();

    // The panel hands focus back to its trigger after its exit animation.
    act(() => trigger.focus());
    await waitFor(() => expect(onClosedAfterSelect).toHaveBeenCalledTimes(1));

    // Closing without a selection never moves the caret.
    trigger.blur();
    fireEvent.click(trigger);
    await screen.findByTestId("picker");
    fireEvent.click(trigger);
    act(() => trigger.focus());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onClosedAfterSelect).toHaveBeenCalledTimes(1);
  });

  it("falls back after a second and does nothing once the control unmounts", async () => {
    jest.useFakeTimers();
    try {
      mockUseIsMobile.mockReturnValue(true);
      const onClosedAfterSelect = jest.fn();
      const select = async () => {
        const view = render(
          <EmojiPickerControl
            onEmojiSelect={jest.fn()}
            onClosedAfterSelect={onClosedAfterSelect}
          />
        );
        fireEvent.click(view.getByRole("button", { hidden: true }));
        fireEvent.click(await view.findByTestId("picker"));
        return view;
      };

      // Focus never comes back: the caret returns after a second.
      const first = await select();
      act(() => jest.advanceTimersByTime(999));
      expect(onClosedAfterSelect).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(50));
      expect(onClosedAfterSelect).toHaveBeenCalledTimes(1);
      first.unmount();

      // Unmounted while waiting for focus.
      const second = await select();
      second.unmount();
      act(() => jest.advanceTimersByTime(2000));

      // Unmounted between the fallback and its frame.
      const third = await select();
      act(() => jest.advanceTimersByTime(1000));
      third.unmount();
      act(() => jest.advanceTimersByTime(100));

      expect(onClosedAfterSelect).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not take focus back from where the user went", async () => {
    jest.useFakeTimers();
    try {
      mockUseIsMobile.mockReturnValue(true);
      const onClosedAfterSelect = jest.fn();
      render(
        <>
          <input aria-label="Other field" />
          <EmojiPickerControl
            onEmojiSelect={jest.fn()}
            onClosedAfterSelect={onClosedAfterSelect}
          />
        </>
      );
      const trigger = screen.getByRole("button", { name: "Open emoji picker" });
      const other = screen.getByRole("textbox", { name: "Other field" });
      const select = async () => {
        fireEvent.click(trigger);
        fireEvent.click(await screen.findByTestId("picker"));
      };

      // The user moves on before the fallback.
      await select();
      act(() => other.focus());
      act(() => jest.advanceTimersByTime(1050));

      // The panel hands focus to the trigger, then the user moves on before
      // the restore's frame: the check runs at the restore itself.
      other.blur();
      await select();
      act(() => trigger.focus());
      act(() => other.focus());
      act(() => jest.advanceTimersByTime(1050));

      expect(onClosedAfterSelect).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("labels the trigger by what it will do", async () => {
    render(<EmojiPickerControl onEmojiSelect={jest.fn()} />);
    const trigger = screen.getByRole("button", { name: "Open emoji picker" });
    fireEvent.click(trigger);
    await screen.findByTestId("picker");
    expect(trigger).toHaveAccessibleName("Close emoji picker");
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
    expect(picker).toHaveAttribute("data-auto-focus", "true");
    fireEvent.click(picker);
    expect(fakeEditor.update).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByTestId("mobile-dialog")).toBeNull()
    );
  });

  it("focuses the Waves editor again once the mobile panel hands focus back", async () => {
    mockUseIsMobile.mockReturnValue(true);
    render(<CreateDropEmojiPicker />);
    const trigger = screen.getByRole("button", { name: "Open emoji picker" });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByTestId("picker"));
    await waitFor(() =>
      expect(screen.queryByTestId("mobile-dialog")).toBeNull()
    );
    await waitFor(() => expect(fakeEditor.focus).toHaveBeenCalled());
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const focusedBefore = fakeEditor.focus.mock.calls.length;

    // The panel's exit gives its trigger focus; the editor takes it back.
    act(() => trigger.focus());
    await waitFor(() =>
      expect(fakeEditor.focus).toHaveBeenCalledTimes(focusedBefore + 1)
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
