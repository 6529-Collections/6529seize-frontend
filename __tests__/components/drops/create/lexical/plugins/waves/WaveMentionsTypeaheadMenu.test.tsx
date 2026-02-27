import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WaveMentionsTypeaheadMenu from "@/components/drops/create/lexical/plugins/waves/WaveMentionsTypeaheadMenu";

function createOption(name: string) {
  return {
    key: `option-${name}`,
    name,
    picture: null,
    setRefElement: jest.fn(),
  };
}

function createAnchorElement() {
  return document.createElement("div");
}

describe("WaveMentionsTypeaheadMenu", () => {
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
    getBoundingClientRectMock = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(baseRect as DOMRect);
  });

  afterEach(() => {
    getBoundingClientRectMock.mockRestore();
    jest.clearAllMocks();
  });

  it("renders with bottom positioning when there is more space below", () => {
    const options = [createOption("Wave Alpha"), createOption("Wave Beta")];
    const { container } = render(
      <WaveMentionsTypeaheadMenu
        selectedIndex={0}
        options={options as any}
        setHighlightedIndex={jest.fn()}
        selectOptionAndCleanUp={jest.fn()}
        anchorElement={createAnchorElement()}
      />
    );

    expect(container.firstChild).toHaveClass("tw-top-full");
    expect(container.firstChild).toHaveClass("tw-mt-1");
  });

  it("switches to top positioning when there is more space above", async () => {
    getBoundingClientRectMock.mockReturnValue({
      ...baseRect,
      top: 700,
      bottom: 790,
    } as DOMRect);

    const options = [createOption("Wave Alpha")];
    const { container } = render(
      <WaveMentionsTypeaheadMenu
        selectedIndex={0}
        options={options as any}
        setHighlightedIndex={jest.fn()}
        selectOptionAndCleanUp={jest.fn()}
        anchorElement={createAnchorElement()}
      />
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass("tw-bottom-full");
      expect(container.firstChild).toHaveClass("tw-mb-1");
    });
  });

  it("selects clicked option and remains stable across repeated resize events", () => {
    const options = [createOption("Wave Alpha"), createOption("Wave Beta")];
    const setHighlightedIndex = jest.fn();
    const selectOptionAndCleanUp = jest.fn();

    render(
      <WaveMentionsTypeaheadMenu
        selectedIndex={0}
        options={options as any}
        setHighlightedIndex={setHighlightedIndex}
        selectOptionAndCleanUp={selectOptionAndCleanUp}
        anchorElement={createAnchorElement()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Wave Alpha" }));

    expect(setHighlightedIndex).toHaveBeenCalledWith(0);
    expect(selectOptionAndCleanUp).toHaveBeenCalledWith(options[0]);

    for (let i = 0; i < 5; i += 1) {
      fireEvent(window, new Event("resize"));
    }

    expect(
      screen.getByRole("button", { name: "Wave Alpha" })
    ).toBeInTheDocument();
  });

  it("recalculates position on scroll events", async () => {
    let rect = baseRect as DOMRect;
    getBoundingClientRectMock.mockImplementation(() => rect);

    const options = [createOption("Wave Alpha")];
    const { container } = render(
      <WaveMentionsTypeaheadMenu
        selectedIndex={0}
        options={options as any}
        setHighlightedIndex={jest.fn()}
        selectOptionAndCleanUp={jest.fn()}
        anchorElement={createAnchorElement()}
      />
    );

    rect = {
      ...baseRect,
      top: 700,
      bottom: 790,
    } as DOMRect;
    fireEvent(window, new Event("scroll"));

    await waitFor(() => {
      expect(container.firstChild).toHaveClass("tw-bottom-full");
      expect(container.firstChild).toHaveClass("tw-mb-1");
    });
  });

  it("observes anchor element and cleans up resize/scroll listeners", () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const ResizeObserverMock = jest.fn().mockImplementation(() => ({
      observe,
      disconnect,
      unobserve: jest.fn(),
    }));
    globalThis.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;

    const addListenerSpy = jest.spyOn(window, "addEventListener");
    const removeListenerSpy = jest.spyOn(window, "removeEventListener");
    const anchorElement = createAnchorElement();

    try {
      const options = [createOption("Wave Alpha")];
      const { unmount } = render(
        <WaveMentionsTypeaheadMenu
          selectedIndex={0}
          options={options as any}
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
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      addListenerSpy.mockRestore();
      removeListenerSpy.mockRestore();
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });
});
