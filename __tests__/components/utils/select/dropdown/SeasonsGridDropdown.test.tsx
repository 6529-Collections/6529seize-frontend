import SeasonsGridDropdown from "@/components/utils/select/dropdown/SeasonsGridDropdown";
import { MemeSeason } from "@/entities/ISeason";
import { act, fireEvent, render, screen } from "@testing-library/react";

const mockSeasons: MemeSeason[] = [
  {
    id: 1,
    start_index: 1,
    end_index: 100,
    count: 100,
    name: "SZN1",
    display: "SZN 1",
  },
  {
    id: 2,
    start_index: 101,
    end_index: 200,
    count: 100,
    name: "SZN2",
    display: "SZN 2",
  },
  {
    id: 3,
    start_index: 201,
    end_index: 300,
    count: 100,
    name: "SZN3",
    display: "SZN 3",
  },
];

const flushPromises = () => act(() => Promise.resolve());

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve(mockSeasons)),
}));

jest.mock("framer-motion", () => ({
  useAnimate: () => [{ current: null }, jest.fn()],
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("react-use", () => ({
  createBreakpoint: () => () => "LG",
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
}));

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("SeasonsGridDropdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with 'All Seasons' label when nothing is selected", async () => {
    const setSelected = jest.fn();

    render(<SeasonsGridDropdown selected={null} setSelected={setSelected} />);
    await flushPromises();

    expect(
      screen.getByRole("button", { name: /Season: All Seasons/i })
    ).toBeInTheDocument();
  });

  it("displays selected season label when a season is selected", async () => {
    const setSelected = jest.fn();
    const selectedSeason = mockSeasons[1];

    render(
      <SeasonsGridDropdown
        selected={selectedSeason}
        setSelected={setSelected}
      />
    );
    await flushPromises();

    expect(
      screen.getByRole("button", { name: /Season: SZN 2/i })
    ).toBeInTheDocument();
  });

  it("opens dropdown on button click", async () => {
    const setSelected = jest.fn();

    render(<SeasonsGridDropdown selected={null} setSelected={setSelected} />);
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: All Seasons/i });
    fireEvent.click(button);

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("fetches and displays seasons from API", async () => {
    const setSelected = jest.fn();

    render(<SeasonsGridDropdown selected={null} setSelected={setSelected} />);
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: All Seasons/i });
    fireEvent.click(button);

    expect(screen.getByRole("menu")).toBeInTheDocument();

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(4);
    expect(menuItems[0]).toHaveTextContent("All Seasons");
    expect(menuItems[1]).toHaveTextContent("SZN 1");
    expect(menuItems[2]).toHaveTextContent("SZN 2");
    expect(menuItems[3]).toHaveTextContent("SZN 3");
  });

  it("calls setSelected with null when 'All Seasons' is clicked", async () => {
    const setSelected = jest.fn();

    render(
      <SeasonsGridDropdown
        selected={mockSeasons[0]}
        setSelected={setSelected}
      />
    );
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: SZN 1/i });
    fireEvent.click(button);

    const allSeasonsButton = screen.getByRole("menuitem", {
      name: /All Seasons/i,
    });
    fireEvent.click(allSeasonsButton);

    expect(setSelected).toHaveBeenCalledWith(null);
  });

  it("calls setSelected with season when a season is clicked", async () => {
    const setSelected = jest.fn();

    render(<SeasonsGridDropdown selected={null} setSelected={setSelected} />);
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: All Seasons/i });
    fireEvent.click(button);

    const szn2Button = screen.getByRole("menuitem", { name: /SZN 2/i });
    fireEvent.click(szn2Button);

    expect(setSelected).toHaveBeenCalledWith(mockSeasons[1]);
  });

  it("applies selected styles to 'All Seasons' when selected is null", async () => {
    const setSelected = jest.fn();

    render(<SeasonsGridDropdown selected={null} setSelected={setSelected} />);
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: All Seasons/i });
    fireEvent.click(button);

    const allSeasonsButton = screen.getByRole("menuitem", {
      name: /All Seasons/i,
    });
    expect(allSeasonsButton).toHaveClass("tw-bg-primary-500/20");
    expect(allSeasonsButton).toHaveClass("tw-border-primary-500");
    expect(allSeasonsButton).toHaveClass("tw-text-primary-300");
  });

  it("applies selected styles to the selected season", async () => {
    const setSelected = jest.fn();

    render(
      <SeasonsGridDropdown
        selected={mockSeasons[0]}
        setSelected={setSelected}
      />
    );
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: SZN 1/i });
    fireEvent.click(button);

    const szn1Button = screen.getByRole("menuitem", { name: /SZN 1/i });
    expect(szn1Button).toHaveClass("tw-bg-primary-500/20");
    expect(szn1Button).toHaveClass("tw-border-primary-500");
    expect(szn1Button).toHaveClass("tw-text-primary-300");
  });

  it("applies non-selected styles to unselected items", async () => {
    const setSelected = jest.fn();

    render(
      <SeasonsGridDropdown
        selected={mockSeasons[0]}
        setSelected={setSelected}
      />
    );
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: SZN 1/i });
    fireEvent.click(button);

    const szn2Button = screen.getByRole("menuitem", { name: /SZN 2/i });
    expect(szn2Button).toHaveClass("tw-bg-transparent");
    expect(szn2Button).toHaveClass("tw-border-iron-700");
    expect(szn2Button).toHaveClass("tw-text-iron-200");
  });

  it("applies initial season from initialSeasonId prop", async () => {
    const setSelected = jest.fn();

    render(
      <SeasonsGridDropdown
        selected={null}
        setSelected={setSelected}
        initialSeasonId={2}
      />
    );
    await flushPromises();

    expect(setSelected).toHaveBeenCalledWith(mockSeasons[1]);
  });

  it("does not apply initial season when initialSeasonId is null", async () => {
    const setSelected = jest.fn();

    render(
      <SeasonsGridDropdown
        selected={null}
        setSelected={setSelected}
        initialSeasonId={null}
      />
    );
    await flushPromises();

    expect(
      screen.getByRole("button", { name: /Season: All Seasons/i })
    ).toBeInTheDocument();
    expect(setSelected).not.toHaveBeenCalled();
  });

  it("disables button when disabled prop is true", async () => {
    const setSelected = jest.fn();

    render(
      <SeasonsGridDropdown selected={null} setSelected={setSelected} disabled />
    );
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: All Seasons/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("tw-opacity-50");
  });

  it("closes dropdown when selecting an item", async () => {
    const setSelected = jest.fn();

    render(<SeasonsGridDropdown selected={null} setSelected={setSelected} />);
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: All Seasons/i });
    fireEvent.click(button);

    const szn1Button = screen.getByRole("menuitem", { name: /SZN 1/i });
    fireEvent.click(szn1Button);

    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("has correct aria attributes", async () => {
    const setSelected = jest.fn();

    render(<SeasonsGridDropdown selected={null} setSelected={setSelected} />);
    await flushPromises();

    const button = screen.getByRole("button", { name: /Season: All Seasons/i });
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
