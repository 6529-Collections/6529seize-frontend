import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useKeyPressEvent } from "react-use";
import MentionsTypeaheadMenu from "@/components/drops/create/lexical/plugins/mentions/MentionsTypeaheadMenu";

import { MentionTypeaheadOption } from "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin";

jest.mock("react-use", () => ({
  useKeyPressEvent: jest.fn(),
}));

const mockUseKeyPressEvent = useKeyPressEvent as jest.Mock;

const createOption = (handle = "alice") =>
  new MentionTypeaheadOption({
    id: handle,
    handle,
    display: `${handle} display`,
    picture: null,
    level: 42,
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

  it("shows a known level in the selectable row without adding a nested button", () => {
    const option = createOption();
    const select = jest.fn();
    render(
      <MentionsTypeaheadMenu
        selectedIndex={0}
        options={[option]}
        setHighlightedIndex={jest.fn()}
        selectOptionAndCleanUp={select}
        anchorElement={null}
      />
    );
    const row = screen.getByRole("button", { name: /alice.*Level 42/i });
    expect(within(row).getByRole("img", { name: "Level 42" })).toBeVisible();
    expect(within(row).queryByRole("button")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("img", { name: "Level 42" }));
    expect(select).toHaveBeenCalledWith(option);
  });

  it("shows level zero as a known level", () => {
    const option = createOption();
    option.level = 0;
    render(
      <MentionsTypeaheadMenu
        selectedIndex={0}
        options={[option]}
        setHighlightedIndex={jest.fn()}
        selectOptionAndCleanUp={jest.fn()}
        anchorElement={null}
      />
    );
    expect(screen.getByRole("img", { name: "Level 0" })).toBeVisible();
  });

  it.each([null, Number.NaN, -1, 101, 1.5])(
    "omits an unknown or invalid level (%s)",
    (level) => {
      const option = createOption();
      option.level = level;
      render(
        <MentionsTypeaheadMenu
          selectedIndex={0}
          options={[option]}
          setHighlightedIndex={jest.fn()}
          selectOptionAndCleanUp={jest.fn()}
          anchorElement={null}
        />
      );
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /alice/i })).toBeVisible();
    }
  );

  it.each(["group", "alias"] as const)(
    "never adds a level to a %s option",
    (type) => {
      const option = createOption("@all");
      option.type = type;
      render(
        <MentionsTypeaheadMenu
          selectedIndex={0}
          options={[option]}
          setHighlightedIndex={jest.fn()}
          selectOptionAndCleanUp={jest.fn()}
          anchorElement={null}
        />
      );
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    }
  );

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
        options={[option]}
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
          options={[createOption()]}
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
        options={[createOption()]}
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
        options={[option]}
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
