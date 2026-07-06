import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useKeyPressEvent } from "react-use";
import MentionsTypeaheadMenu from "@/components/drops/create/lexical/plugins/mentions/MentionsTypeaheadMenu";

jest.mock("react-use", () => ({
  useKeyPressEvent: jest.fn(),
}));

const mockUseKeyPressEvent = useKeyPressEvent as jest.Mock;

function createOption(handle: string) {
  return {
    key: `option-${handle}`,
    handle,
    display: `${handle} display`,
    picture: null,
    setRefElement: jest.fn(),
  };
}

function createAnchorElement() {
  return document.createElement("div");
}

describe("MentionsTypeaheadMenu", () => {
  const baseRect = {
    x: 0,
    y: 0,
    width: 320,
    height: 120,
    top: 100,
    right: 320,
    bottom: 220,
    left: 0,
    toJSON: () => "",
  };

  let getBoundingClientRectMock: jest.SpyInstance;

  beforeEach(() => {
    mockUseKeyPressEvent.mockReset();
    getBoundingClientRectMock = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(baseRect as DOMRect);
  });

  afterEach(() => {
    getBoundingClientRectMock.mockRestore();
    jest.clearAllMocks();
  });

  it("calls select when space pressed", () => {
    const options = [createOption("alice")];
    const setHighlightedIndex = jest.fn();
    const selectOptionAndCleanUp = jest.fn();
    mockUseKeyPressEvent.mockImplementation((_key, cb) => {
      cb();
    });

    render(
      <MentionsTypeaheadMenu
        selectedIndex={0}
        options={options as any}
        setHighlightedIndex={setHighlightedIndex}
        selectOptionAndCleanUp={selectOptionAndCleanUp}
        anchorElement={createAnchorElement()}
      />
    );

    expect(setHighlightedIndex).toHaveBeenCalledWith(0);
    expect(selectOptionAndCleanUp).toHaveBeenCalledWith(options[0]);
  });

  it("renders with bottom positioning when there is more space below", () => {
    const { container } = render(
      <MentionsTypeaheadMenu
        selectedIndex={null}
        options={[createOption("alice")] as any}
        setHighlightedIndex={jest.fn()}
        selectOptionAndCleanUp={jest.fn()}
        anchorElement={createAnchorElement()}
      />
    );

    expect(container.firstChild).toHaveClass("tw-absolute");
    expect(container.firstChild).toHaveClass("tw-z-50");
    expect(container.firstChild).toHaveClass("tw-top-full");
    expect(container.firstChild).toHaveClass("tw-mt-1");
  });

  it("switches to top positioning when the anchor is above the mobile keyboard viewport", async () => {
    getBoundingClientRectMock.mockReturnValue({
      ...baseRect,
      top: 360,
      bottom: 400,
    } as DOMRect);

    const originalVisualViewport = globalThis.visualViewport;
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: {
        height: 430,
        offsetTop: 0,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    });

    try {
      const { container } = render(
        <MentionsTypeaheadMenu
          selectedIndex={0}
          options={[createOption("alice")] as any}
          setHighlightedIndex={jest.fn()}
          selectOptionAndCleanUp={jest.fn()}
          anchorElement={createAnchorElement()}
        />
      );

      await waitFor(() => {
        expect(container.firstChild).toHaveClass("tw-bottom-full");
        expect(container.firstChild).toHaveClass("tw-mb-1");
      });
    } finally {
      Object.defineProperty(globalThis, "visualViewport", {
        configurable: true,
        value: originalVisualViewport,
      });
    }
  });

  it("preserves editor focus before selecting a clicked option", () => {
    const options = [createOption("alice")];
    const setHighlightedIndex = jest.fn();
    const selectOptionAndCleanUp = jest.fn();

    render(
      <MentionsTypeaheadMenu
        selectedIndex={0}
        options={options as any}
        setHighlightedIndex={setHighlightedIndex}
        selectOptionAndCleanUp={selectOptionAndCleanUp}
        anchorElement={createAnchorElement()}
      />
    );

    const optionButton = screen.getByRole("button", { name: /alice/i });
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    optionButton.dispatchEvent(mouseDownEvent);

    expect(mouseDownEvent.defaultPrevented).toBe(true);

    fireEvent.click(optionButton);

    expect(setHighlightedIndex).toHaveBeenCalledWith(0);
    expect(selectOptionAndCleanUp).toHaveBeenCalledWith(options[0]);
  });

  it("recalculates position on visual viewport resize events", async () => {
    let rect = baseRect as DOMRect;
    getBoundingClientRectMock.mockImplementation(() => rect);

    const visualViewportListeners = new Map<string, EventListener>();
    const originalVisualViewport = globalThis.visualViewport;
    const visualViewport = {
      height: 900,
      offsetTop: 0,
      addEventListener: jest.fn(
        (eventName: string, listener: EventListener) => {
          visualViewportListeners.set(eventName, listener);
        }
      ),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });

    try {
      const { container } = render(
        <MentionsTypeaheadMenu
          selectedIndex={0}
          options={[createOption("alice")] as any}
          setHighlightedIndex={jest.fn()}
          selectOptionAndCleanUp={jest.fn()}
          anchorElement={createAnchorElement()}
        />
      );

      expect(container.firstChild).toHaveClass("tw-top-full");

      rect = {
        ...baseRect,
        top: 360,
        bottom: 400,
      } as DOMRect;
      visualViewport.height = 430;

      visualViewportListeners.get("resize")?.(new Event("resize"));

      await waitFor(() => {
        expect(container.firstChild).toHaveClass("tw-bottom-full");
        expect(container.firstChild).toHaveClass("tw-mb-1");
      });
    } finally {
      Object.defineProperty(globalThis, "visualViewport", {
        configurable: true,
        value: originalVisualViewport,
      });
    }
  });

  it("observes anchor element and cleans up viewport listeners", () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const originalVisualViewport = globalThis.visualViewport;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const ResizeObserverMock = jest.fn().mockImplementation(() => ({
      observe,
      disconnect,
      unobserve: jest.fn(),
    }));
    globalThis.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;

    const visualViewport = {
      height: 900,
      offsetTop: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });

    const addListenerSpy = jest.spyOn(window, "addEventListener");
    const removeListenerSpy = jest.spyOn(window, "removeEventListener");
    const anchorElement = createAnchorElement();

    try {
      const { unmount } = render(
        <MentionsTypeaheadMenu
          selectedIndex={0}
          options={[createOption("alice")] as any}
          setHighlightedIndex={jest.fn()}
          selectOptionAndCleanUp={jest.fn()}
          anchorElement={anchorElement}
        />
      );

      expect(addListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
      expect(addListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        { passive: true }
      );
      expect(visualViewport.addEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
      expect(visualViewport.addEventListener).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        { passive: true }
      );
      expect(observe).toHaveBeenCalledWith(anchorElement);

      unmount();

      expect(removeListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
      expect(removeListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function)
      );
      expect(visualViewport.removeEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
      expect(visualViewport.removeEventListener).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function)
      );
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      addListenerSpy.mockRestore();
      removeListenerSpy.mockRestore();
      globalThis.ResizeObserver = originalResizeObserver;
      Object.defineProperty(globalThis, "visualViewport", {
        configurable: true,
        value: originalVisualViewport,
      });
    }
  });
});
