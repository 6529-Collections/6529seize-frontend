import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useKeyPressEvent } from "react-use";
import MentionsTypeaheadMenu from "@/components/drops/create/lexical/plugins/mentions/MentionsTypeaheadMenu";

jest.mock("react-use", () => ({
  useKeyPressEvent: jest.fn(),
}));

const mockUseKeyPressEvent = useKeyPressEvent as jest.Mock;

const createOption = (handle = "alice") => ({
  key: `option-${handle}`,
  handle,
  display: `${handle} display`,
  picture: null,
  setRefElement: jest.fn(),
});

const anchorRectNearKeyboard = {
  x: 0,
  y: 360,
  width: 320,
  height: 40,
  top: 360,
  right: 320,
  bottom: 400,
  left: 0,
  toJSON: () => "",
} as DOMRect;

describe("MentionsTypeaheadMenu", () => {
  beforeEach(() => {
    mockUseKeyPressEvent.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("selects the highlighted option when space is pressed", () => {
    const option = createOption();
    const setHighlightedIndex = jest.fn();
    const selectOptionAndCleanUp = jest.fn();
    mockUseKeyPressEvent.mockImplementation((_key, onSpace) => {
      onSpace();
    });

    render(
      <MentionsTypeaheadMenu
        selectedIndex={0}
        options={[option] as any}
        setHighlightedIndex={setHighlightedIndex}
        selectOptionAndCleanUp={selectOptionAndCleanUp}
        anchorElement={document.createElement("div")}
      />
    );

    expect(setHighlightedIndex).toHaveBeenCalledWith(0);
    expect(selectOptionAndCleanUp).toHaveBeenCalledWith(option);
  });

  it("keeps the menu above the mobile visual viewport keyboard area", async () => {
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(anchorRectNearKeyboard);
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
          options={[createOption()] as any}
          setHighlightedIndex={jest.fn()}
          selectOptionAndCleanUp={jest.fn()}
          anchorElement={document.createElement("div")}
        />
      );

      await waitFor(() => {
        expect(container.firstChild).toHaveClass("tw-bottom-full", "tw-mb-1");
      });
    } finally {
      Object.defineProperty(globalThis, "visualViewport", {
        configurable: true,
        value: originalVisualViewport,
      });
    }
  });

  it("handles a missing anchor without throwing", () => {
    const { container } = render(
      <MentionsTypeaheadMenu
        selectedIndex={null}
        options={[createOption()] as any}
        setHighlightedIndex={jest.fn()}
        selectOptionAndCleanUp={jest.fn()}
        anchorElement={null}
      />
    );

    fireEvent(window, new Event("resize"));

    expect(container.firstChild).toHaveClass("tw-top-full", "tw-mt-1");
  });

  it("preserves editor focus before selecting a clicked option", () => {
    const option = createOption();
    const setHighlightedIndex = jest.fn();
    const selectOptionAndCleanUp = jest.fn();

    render(
      <MentionsTypeaheadMenu
        selectedIndex={0}
        options={[option] as any}
        setHighlightedIndex={setHighlightedIndex}
        selectOptionAndCleanUp={selectOptionAndCleanUp}
        anchorElement={document.createElement("div")}
      />
    );

    const optionButton = screen.getByRole("button", { name: /alice/i });
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    optionButton.dispatchEvent(mouseDownEvent);
    fireEvent.click(optionButton);

    expect(mouseDownEvent.defaultPrevented).toBe(true);
    expect(setHighlightedIndex).toHaveBeenCalledWith(0);
    expect(selectOptionAndCleanUp).toHaveBeenCalledWith(option);
  });
});
