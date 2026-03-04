import { AuthContext } from "@/components/auth/Auth";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useWave = jest.fn();
const sortComponentMock = jest.fn((props: any) => (
  <button
    data-testid="sort"
    data-mode={props.mode}
    onClick={() => props.onSortChange("SORT" as any)}
  />
));
const curationComponentMock = jest.fn((props: any) => (
  <button
    data-testid="curation-group-select"
    data-mode={props.mode}
    onClick={() => props.onChange("cg-1")}
  >
    Curation
  </button>
));
const resolveHeaderLayoutMock = jest.fn();

jest.mock("@/components/waves/leaderboard/header/WaveleaderboardSort", () => ({
  WAVE_LEADERBOARD_SORT_ITEMS: [
    { key: "RANK", label: "Current Vote", value: "RANK" },
    {
      key: "RATING_PREDICTION",
      label: "Projected Vote",
      value: "RATING_PREDICTION",
    },
    { key: "TREND", label: "Hot", value: "TREND" },
    { key: "CREATED_AT", label: "Newest", value: "CREATED_AT" },
  ],
  WAVE_LEADERBOARD_CURATION_SORT_ITEMS: [
    { key: "RANK", label: "Current Vote", value: "RANK" },
    {
      key: "RATING_PREDICTION",
      label: "Projected Vote",
      value: "RATING_PREDICTION",
    },
    { key: "TREND", label: "Hot", value: "TREND" },
    { key: "CREATED_AT", label: "Newest", value: "CREATED_AT" },
    { key: "PRICE", label: "Price", value: "PRICE" },
  ],
  WaveleaderboardSort: (props: any) => sortComponentMock(props),
}));

jest.mock(
  "@/components/waves/leaderboard/header/WaveLeaderboardCurationGroupSelect",
  () => ({
    WaveLeaderboardCurationGroupSelect: (props: any) =>
      curationComponentMock(props),
  })
);

jest.mock(
  "@/components/waves/leaderboard/header/waveLeaderboardHeaderLayout",
  () => ({
    resolveWaveLeaderboardHeaderLayout: (...args: any[]) =>
      resolveHeaderLayoutMock(...args),
  })
);

jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => useWave(...args),
  SubmissionStatus: {
    NOT_STARTED: "NOT_STARTED",
    ACTIVE: "ACTIVE",
    ENDED: "ENDED",
  },
}));

jest.mock("@/components/utils/button/PrimaryButton", () => (props: any) => (
  <button
    data-testid="create"
    data-padding={props.padding}
    onClick={props.onClicked}
    disabled={props.disabled}
  >
    {props.children}
  </button>
));

jest.mock("react-use", () => {
  const React = require("react");

  return {
    createBreakpoint: jest.fn(() => () => "MD"),
    useDebounce: (fn: () => void, ms: number, deps: readonly unknown[]) => {
      React.useEffect(() => {
        const timeoutId = setTimeout(() => {
          fn();
        }, ms);
        return () => clearTimeout(timeoutId);
      }, deps);
    },
  };
});

const wave = { id: "w" } as any;

beforeEach(() => {
  sortComponentMock.mockClear();
  curationComponentMock.mockClear();
  resolveHeaderLayoutMock.mockReset();
  resolveHeaderLayoutMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "tabs",
    enableControlsScroll: false,
    actionMode: "full",
    wrapActions: false,
  });

  useWave.mockReturnValue({
    isMemesWave: true,
    isCurationWave: false,
    participation: {
      isEligible: true,
      canSubmitNow: true,
      hasReachedLimit: false,
      status: "ACTIVE",
    },
  });
});

it("renders meme controls and handles actions", async () => {
  const user = userEvent.setup();
  const onCreate = jest.fn();
  const onViewModeChange = jest.fn();
  const onSortChange = jest.fn();
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={onCreate}
        viewMode="list"
        onViewModeChange={onViewModeChange}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={onSortChange}
      />
    </AuthContext.Provider>
  );

  await waitFor(() =>
    expect(screen.getByTestId("sort")).toHaveAttribute("data-mode", "dropdown")
  );

  await user.click(screen.getByRole("tab", { name: "List view" }));
  expect(onViewModeChange).toHaveBeenCalledWith("list");
  // sort
  await user.click(screen.getByTestId("sort"));
  expect(onSortChange).toHaveBeenCalledWith("SORT");
  // create drop
  await user.click(screen.getByTestId("create"));
  expect(onCreate).toHaveBeenCalled();
});

it("renders three view toggles and sort for non-meme waves", async () => {
  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: false,
    participation: { isEligible: true },
  });
  const user = userEvent.setup();
  const onViewModeChange = jest.fn();
  const onSortChange = jest.fn();

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="grid_content_only"
        onViewModeChange={onViewModeChange}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={onSortChange}
      />
    </AuthContext.Provider>
  );

  await waitFor(() =>
    expect(screen.getByTestId("sort")).toHaveAttribute("data-mode", "dropdown")
  );

  expect(screen.getByTestId("sort")).toBeInTheDocument();
  await user.click(screen.getByTestId("sort"));
  expect(onSortChange).toHaveBeenCalledWith("SORT");
  await user.click(screen.getByRole("tab", { name: "Content only" }));
  expect(onViewModeChange).toHaveBeenCalledWith("grid_content_only");
});

it("renders curation selector and handles curation filter changes", async () => {
  const user = userEvent.setup();
  const onCurationGroupChange = jest.fn();

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        curationGroups={[
          {
            id: "cg-1",
            name: "Curators One",
            wave_id: "w",
            group_id: "g-1",
            created_at: 1,
            updated_at: 1,
          },
        ]}
        curatedByGroupId={null}
        onCurationGroupChange={onCurationGroupChange}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByTestId("curation-group-select")).toBeInTheDocument();
  expect(screen.getByTestId("curation-group-select")).toHaveAttribute(
    "data-mode",
    "tabs"
  );
  await user.click(screen.getByTestId("curation-group-select"));
  expect(onCurationGroupChange).toHaveBeenCalledWith("cg-1");
});

it("renders curation price controls and commits range updates", async () => {
  const user = userEvent.setup();
  const onPriceRangeChange = jest.fn();
  const onCreateDrop = jest.fn();

  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={onCreateDrop}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        onPriceRangeChange={onPriceRangeChange}
      />
    </AuthContext.Provider>
  );

  expect(
    screen.queryByTestId("leaderboard-price-panel")
  ).not.toBeInTheDocument();
  expect(screen.getByTestId("leaderboard-header-actions-row")).toHaveAttribute(
    "data-action-mode",
    "full"
  );
  expect(screen.getByTestId("leaderboard-header-actions-row")).toHaveAttribute(
    "data-wrap",
    "no"
  );
  const createButton = screen.getByTestId("create");
  expect(createButton).toHaveAttribute("data-padding", "tw-px-3.5 tw-py-2");
  expect(screen.getAllByText("Drop Art").length).toBeGreaterThan(0);
  const createIcon = createButton.querySelector("svg");
  expect(createIcon).toHaveClass("tw-h-4", "tw-w-4");

  await user.click(createButton);
  expect(onCreateDrop).toHaveBeenCalledTimes(1);

  await user.click(screen.getByTestId("leaderboard-price-toggle"));
  const minInput = screen.getByTestId("leaderboard-price-min-input");
  const maxInput = screen.getByTestId("leaderboard-price-max-input");
  const priceFiltersContainer = minInput.parentElement?.parentElement;

  expect(minInput).toHaveClass("tw-h-9", "tw-text-sm");
  expect(maxInput).toHaveClass("tw-h-9", "tw-text-sm");
  expect(priceFiltersContainer).not.toBeNull();
  expect(priceFiltersContainer).not.toHaveClass("tw-bg-iron-950");
  expect(priceFiltersContainer).not.toHaveClass("tw-border");
  expect(priceFiltersContainer).not.toHaveClass("tw-rounded-lg");
  expect(priceFiltersContainer).not.toHaveClass("tw-p-2");
  expect(minInput).toHaveAttribute("placeholder", "Min");
  expect(maxInput).toHaveAttribute("placeholder", "Max");
  expect(screen.getByLabelText("Minimum ETH")).toBe(minInput);
  expect(screen.getByLabelText("Maximum ETH")).toBe(maxInput);
  expect(
    screen.queryByRole("button", { name: "Clear filters" })
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Clear Filters")).not.toBeInTheDocument();
  await user.clear(minInput);
  await user.type(minInput, "1.5");
  await user.clear(maxInput);
  await user.type(maxInput, "3.25");
  await user.tab();
  expect(onPriceRangeChange).toHaveBeenLastCalledWith({
    minPrice: 1.5,
    maxPrice: 3.25,
  });

  const latestSortProps =
    sortComponentMock.mock.calls[sortComponentMock.mock.calls.length - 1]?.[0];
  expect(latestSortProps?.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ value: "PRICE", label: "Price" }),
    ])
  );

  const clearButton = screen.getByRole("button", { name: "Clear filters" });
  expect(clearButton).toHaveClass("tw-h-9", "tw-w-9", "tw-rounded-lg");
  await user.click(clearButton);
  expect(onPriceRangeChange).toHaveBeenLastCalledWith({
    minPrice: undefined,
    maxPrice: undefined,
  });
});

it("uses long placeholders when the price filter container is wide", async () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const getBoundingClientRectSpy = jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function () {
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 40,
        right: 600,
        width: 600,
        height: 40,
        toJSON: () => ({}),
      } as DOMRect;
    });

  const observeMock = jest.fn();
  const disconnectMock = jest.fn();
  let resizeObserverCallback: ResizeObserverCallback | null = null;

  globalThis.ResizeObserver = jest
    .fn()
    .mockImplementation((callback: ResizeObserverCallback) => {
      resizeObserverCallback = callback;
      return {
        observe: observeMock,
        unobserve: jest.fn(),
        disconnect: disconnectMock,
      };
    }) as unknown as typeof ResizeObserver;

  try {
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: { isEligible: true },
    });

    const { unmount } = render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
          } as any
        }
      >
        <WaveLeaderboardHeader
          wave={wave}
          onCreateDrop={jest.fn()}
          viewMode="list"
          onViewModeChange={jest.fn()}
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={jest.fn()}
          onPriceRangeChange={jest.fn()}
        />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("leaderboard-price-toggle"));
    const minInput = screen.getByTestId("leaderboard-price-min-input");
    const maxInput = screen.getByTestId("leaderboard-price-max-input");

    expect(minInput).toHaveAttribute("placeholder", "Minimum ETH");
    expect(maxInput).toHaveAttribute("placeholder", "Maximum ETH");

    expect(observeMock).toHaveBeenCalled();
    expect(resizeObserverCallback).toBeTruthy();

    act(() => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });

    await waitFor(() =>
      expect(minInput).toHaveAttribute("placeholder", "Minimum ETH")
    );
    expect(maxInput).toHaveAttribute("placeholder", "Maximum ETH");

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  } finally {
    getBoundingClientRectSpy.mockRestore();
    globalThis.ResizeObserver = originalResizeObserver;
  }
});

it("auto-applies price range updates after debounce while typing", () => {
  jest.useFakeTimers();

  try {
    const onPriceRangeChange = jest.fn();

    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: { isEligible: true },
    });

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
          } as any
        }
      >
        <WaveLeaderboardHeader
          wave={wave}
          onCreateDrop={jest.fn()}
          viewMode="list"
          onViewModeChange={jest.fn()}
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={jest.fn()}
          onPriceRangeChange={onPriceRangeChange}
        />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("leaderboard-price-toggle"));
    const minInput = screen.getByTestId("leaderboard-price-min-input");
    const maxInput = screen.getByTestId("leaderboard-price-max-input");
    fireEvent.change(minInput, { target: { value: "1.5" } });
    fireEvent.change(maxInput, { target: { value: "3.25" } });

    expect(onPriceRangeChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(349);
    });
    expect(onPriceRangeChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onPriceRangeChange).toHaveBeenLastCalledWith({
      minPrice: 1.5,
      maxPrice: 3.25,
    });

    expect(screen.getByTestId("leaderboard-price-clear")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("leaderboard-price-clear"));
    expect(onPriceRangeChange).toHaveBeenLastCalledWith({
      minPrice: undefined,
      maxPrice: undefined,
    });
  } finally {
    jest.useRealTimers();
  }
});

it("does not auto-apply zero draft values during debounce", () => {
  jest.useFakeTimers();

  try {
    const onPriceRangeChange = jest.fn();

    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: { isEligible: true },
    });

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
          } as any
        }
      >
        <WaveLeaderboardHeader
          wave={wave}
          onCreateDrop={jest.fn()}
          viewMode="list"
          onViewModeChange={jest.fn()}
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={jest.fn()}
          onPriceRangeChange={onPriceRangeChange}
        />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("leaderboard-price-toggle"));
    const minInput = screen.getByTestId("leaderboard-price-min-input");

    fireEvent.change(minInput, { target: { value: "0" } });
    act(() => {
      jest.advanceTimersByTime(350);
    });
    expect(onPriceRangeChange).not.toHaveBeenCalled();

    fireEvent.change(minInput, { target: { value: "0." } });
    act(() => {
      jest.advanceTimersByTime(350);
    });
    expect(onPriceRangeChange).not.toHaveBeenCalled();

    fireEvent.change(minInput, { target: { value: "0.125" } });
    act(() => {
      jest.advanceTimersByTime(350);
    });
    expect(onPriceRangeChange).toHaveBeenLastCalledWith({
      minPrice: 0.125,
      maxPrice: undefined,
    });
  } finally {
    jest.useRealTimers();
  }
});

it("commits zero value on blur", async () => {
  const onPriceRangeChange = jest.fn();

  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        onPriceRangeChange={onPriceRangeChange}
      />
    </AuthContext.Provider>
  );

  fireEvent.click(screen.getByTestId("leaderboard-price-toggle"));
  const minInput = screen.getByTestId("leaderboard-price-min-input");

  fireEvent.focus(minInput);
  fireEvent.change(minInput, { target: { value: "0" } });
  fireEvent.blur(minInput);

  await waitFor(() =>
    expect(onPriceRangeChange).toHaveBeenLastCalledWith({
      minPrice: 0,
      maxPrice: undefined,
    })
  );
});

it("auto-expands price filters when min or max price is active", () => {
  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        minPrice={1.25}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByTestId("leaderboard-price-panel")).toBeInTheDocument();
  expect(screen.getByTestId("leaderboard-price-toggle")).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  expect(screen.getByTestId("leaderboard-price-clear")).toBeInTheDocument();
});

it("allows collapsing and reopening filters while price filters are active", async () => {
  const user = userEvent.setup();

  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        minPrice={1.25}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  const toggle = screen.getByTestId("leaderboard-price-toggle");
  expect(screen.getByTestId("leaderboard-price-panel")).toBeInTheDocument();
  expect(toggle).toHaveAttribute("aria-expanded", "true");

  await user.click(toggle);
  await waitFor(() =>
    expect(
      screen.queryByTestId("leaderboard-price-panel")
    ).not.toBeInTheDocument()
  );
  expect(toggle).toHaveAttribute("aria-expanded", "false");

  await user.click(toggle);
  await waitFor(() =>
    expect(screen.getByTestId("leaderboard-price-panel")).toBeInTheDocument()
  );
  expect(toggle).toHaveAttribute("aria-expanded", "true");
});

it("resets price input drafts when committed price props change", async () => {
  const user = userEvent.setup();

  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  const { rerender } = render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        minPrice={1}
        maxPrice={2}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByTestId("leaderboard-price-panel")).toBeInTheDocument();
  const minInput = screen.getByTestId(
    "leaderboard-price-min-input"
  ) as HTMLInputElement;
  const maxInput = screen.getByTestId(
    "leaderboard-price-max-input"
  ) as HTMLInputElement;

  await user.clear(minInput);
  await user.type(minInput, "9");
  await user.clear(maxInput);
  await user.type(maxInput, "10");
  expect(minInput.value).toBe("9");
  expect(maxInput.value).toBe("10");

  rerender(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        minPrice={3}
        maxPrice={4}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(
    (screen.getByTestId("leaderboard-price-min-input") as HTMLInputElement)
      .value
  ).toBe("3");
  expect(
    (screen.getByTestId("leaderboard-price-max-input") as HTMLInputElement)
      .value
  ).toBe("4");
});

it("does not render price controls for non-curation waves", () => {
  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: false,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(
    screen.queryByTestId("leaderboard-price-min-input")
  ).not.toBeInTheDocument();
  expect(
    screen.queryByTestId("leaderboard-price-max-input")
  ).not.toBeInTheDocument();
  expect(
    screen.queryByTestId("leaderboard-price-toggle")
  ).not.toBeInTheDocument();
});

it("does not render curation selector when curation controls are unavailable", () => {
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        curationGroups={[
          {
            id: "cg-1",
            name: "Curators One",
            wave_id: "w",
            group_id: "g-1",
            created_at: 1,
            updated_at: 1,
          },
        ]}
        curatedByGroupId={null}
      />
    </AuthContext.Provider>
  );

  expect(screen.queryByTestId("curation-group-select")).not.toBeInTheDocument();
});

it("applies resolved modes and enables scroll fallback styling when requested", async () => {
  resolveHeaderLayoutMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "dropdown",
    enableControlsScroll: true,
    actionMode: "icon",
    wrapActions: false,
  });

  render(
    <AuthContext.Provider value={{ connectedProfile: {} } as any}>
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        curationGroups={[
          {
            id: "cg-1",
            name: "Curators One",
            wave_id: "w",
            group_id: "g-1",
            created_at: 1,
            updated_at: 1,
          },
        ]}
        curatedByGroupId={null}
        onCurationGroupChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  await waitFor(() =>
    expect(screen.getByTestId("curation-group-select")).toHaveAttribute(
      "data-mode",
      "dropdown"
    )
  );
  expect(
    screen.getByTestId("leaderboard-header-controls-row").className
  ).toContain("tw-overflow-x-auto");
  expect(resolveHeaderLayoutMock).toHaveBeenCalled();
});

it("uses controls row width for non-curation layout measurements", async () => {
  const clientWidthGetter = jest
    .spyOn(HTMLElement.prototype, "clientWidth", "get")
    .mockImplementation(function (this: HTMLElement) {
      if (
        this.getAttribute("data-testid") === "leaderboard-header-controls-row"
      ) {
        return 320;
      }

      if (this.getAttribute("data-testid") === "leaderboard-header-row") {
        return 480;
      }

      return 0;
    });

  try {
    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
          } as any
        }
      >
        <WaveLeaderboardHeader
          wave={wave}
          onCreateDrop={jest.fn()}
          viewMode="list"
          onViewModeChange={jest.fn()}
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={jest.fn()}
        />
      </AuthContext.Provider>
    );

    await waitFor(() =>
      expect(resolveHeaderLayoutMock).toHaveBeenCalledWith(
        expect.objectContaining({
          rowWidth: 320,
        })
      )
    );
  } finally {
    clientWidthGetter.mockRestore();
  }
});

it("uses full header row width when curation actions are inline", async () => {
  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  const clientWidthGetter = jest
    .spyOn(HTMLElement.prototype, "clientWidth", "get")
    .mockImplementation(function (this: HTMLElement) {
      if (
        this.getAttribute("data-testid") === "leaderboard-header-controls-row"
      ) {
        return 320;
      }

      if (this.getAttribute("data-testid") === "leaderboard-header-row") {
        return 480;
      }

      return 0;
    });

  try {
    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
          } as any
        }
      >
        <WaveLeaderboardHeader
          wave={wave}
          onCreateDrop={jest.fn()}
          viewMode="list"
          onViewModeChange={jest.fn()}
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={jest.fn()}
          onPriceRangeChange={jest.fn()}
        />
      </AuthContext.Provider>
    );

    await waitFor(() =>
      expect(resolveHeaderLayoutMock).toHaveBeenCalledWith(
        expect.objectContaining({
          rowWidth: 480,
        })
      )
    );
  } finally {
    clientWidthGetter.mockRestore();
  }
});

it("renders icon-only curation actions with drop glyph when layout requests compact mode", () => {
  resolveHeaderLayoutMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "tabs",
    enableControlsScroll: false,
    actionMode: "icon",
    wrapActions: false,
  });

  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  const actionsRow = screen.getByTestId("leaderboard-header-actions-row");
  expect(actionsRow).toHaveAttribute("data-action-mode", "icon");
  expect(actionsRow).toHaveAttribute("data-wrap", "no");

  const createButton = screen.getByTestId("create");
  expect(createButton).toHaveAttribute("data-padding", "tw-px-2.5 tw-py-2");
  expect(createButton.querySelector('path[d^="M8.62826"]')).not.toBeNull();
});

it("marks the actions row as wrapped when layout requests wrapping", () => {
  resolveHeaderLayoutMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "dropdown",
    enableControlsScroll: false,
    actionMode: "icon",
    wrapActions: true,
  });

  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByTestId("leaderboard-header-actions-row")).toHaveAttribute(
    "data-action-mode",
    "icon"
  );
  expect(screen.getByTestId("leaderboard-header-actions-row")).toHaveAttribute(
    "data-wrap",
    "yes"
  );
  expect(screen.getByTestId("leaderboard-header-row").className).toContain(
    "tw-flex-wrap"
  );
  expect(
    screen.getByTestId("leaderboard-header-controls-row").className
  ).toContain("tw-basis-full");
});

it("moves actions to the price row when filters are open on wrapped layouts", () => {
  resolveHeaderLayoutMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "dropdown",
    enableControlsScroll: false,
    actionMode: "icon",
    wrapActions: true,
  });

  useWave.mockReturnValue({
    isMemesWave: false,
    isCurationWave: true,
    participation: { isEligible: true },
  });

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        minPrice={1.25}
        onPriceRangeChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByTestId("leaderboard-price-panel")).toBeInTheDocument();
  expect(
    screen.queryByTestId("leaderboard-header-actions-row")
  ).not.toBeInTheDocument();
  const priceActionsRow = screen.getByTestId("leaderboard-price-actions-row");
  expect(priceActionsRow).toBeInTheDocument();
  expect(priceActionsRow.className).toContain("tw-ml-auto");
  expect(priceActionsRow).toContainElement(
    screen.getByTestId("leaderboard-price-toggle")
  );
  expect(screen.getByTestId("leaderboard-header-row").className).toContain(
    "tw-flex-nowrap"
  );
  expect(
    screen.getByTestId("leaderboard-header-controls-row").className
  ).not.toContain("tw-basis-full");
});
