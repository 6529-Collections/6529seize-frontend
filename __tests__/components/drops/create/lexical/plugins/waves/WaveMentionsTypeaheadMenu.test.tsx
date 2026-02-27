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
});
