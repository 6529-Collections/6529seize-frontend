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
const resolveControlModesMock = jest.fn();

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
  "@/components/waves/leaderboard/header/waveLeaderboardHeaderControls",
  () => ({
    resolveWaveLeaderboardHeaderControlModes: (...args: any[]) =>
      resolveControlModesMock(...args),
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
  resolveControlModesMock.mockReset();
  resolveControlModesMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "tabs",
    enableControlsScroll: false,
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
  const createButton = screen.getByTestId("create");
  expect(createButton).toHaveAttribute("data-padding", "tw-px-3.5 tw-py-2");
  expect(screen.getByText("Drop Art")).toBeInTheDocument();
  const createIcon = createButton.querySelector("svg");
  expect(createIcon).toHaveClass("tw-h-4", "tw-w-4");

  await user.click(createButton);
  expect(onCreateDrop).toHaveBeenCalledTimes(1);

  await user.click(screen.getByTestId("leaderboard-price-toggle"));
  const minInput = screen.getByTestId("leaderboard-price-min-input");
  const maxInput = screen.getByTestId("leaderboard-price-max-input");
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

  await user.click(screen.getByTestId("leaderboard-price-clear"));
  expect(onPriceRangeChange).toHaveBeenLastCalledWith({
    minPrice: undefined,
    maxPrice: undefined,
  });
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
  resolveControlModesMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "dropdown",
    enableControlsScroll: true,
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
  expect(resolveControlModesMock).toHaveBeenCalled();
});
