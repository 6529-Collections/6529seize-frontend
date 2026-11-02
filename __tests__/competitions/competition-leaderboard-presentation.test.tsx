import { fireEvent, render, screen } from "@testing-library/react";
import CompetitionLeaderboard from "@/components/competitions/CompetitionLeaderboard";
let mockType = "RANK";
let mockCapabilities: string[] = [];
const mockResource = jest.fn();
const latestLeaderboardParams = () =>
  mockResource.mock.calls.filter((call) => call[1] === "leaderboard").at(-1)[2];
let mockDropError: { status: number } | null = null;
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    wave: { id: "wave" },
    competition: {
      id: "comp",
      capabilities: mockCapabilities,
      type: mockType,
      lifecycle: "PUBLISHED",
      permissions: { vote: true, submit: true },
      winners: {
        max_winners: 3,
        winning_min_threshold: 100,
        winning_threshold_min_duration_ms: 5000,
      },
      decisions: { time_lock_ms: null },
      voting: { ends_at: null },
    },
  }),
}));
jest.mock("@/helpers/competition-presentation.helpers", () => ({
  competitionPresentationWave: () => ({ id: "wave" }),
}));
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => true,
  isCompetitionAccessError: jest.requireActual("@/helpers/competition.helpers")
    .isCompetitionAccessError,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionResource: (
    identity: unknown,
    resource: string,
    params: unknown
  ) => {
    mockResource(identity, resource, params);
    return {
      data: {
        pages: [
          {
            data:
              resource === "leaderboard"
                ? [{ entry_id: "entry", drop_id: "drop" }]
                : [],
          },
        ],
      },
      isPending: false,
      hasNextPage: false,
      isError: false,
    };
  },
}));
jest.mock("@/hooks/competitions/useCompetitionEntryDrops", () => ({
  useCompetitionEntryDrops: () => [
    {
      data: { drop: { id: "drop" } },
      isError: mockDropError !== null,
      error: mockDropError,
    },
  ],
}));
jest.mock("@/hooks/competitions/useCompetitionDropNavigation", () => ({
  useCompetitionDropNavigation: () => jest.fn(),
}));
jest.mock("@/hooks/useWaveDropsLeaderboard", () => ({
  WaveDropsLeaderboardSort: {
    RANK: "RANK",
    REALTIME_VOTE: "REALTIME_VOTE",
    RATING_PREDICTION: "RATING_PREDICTION",
    TREND: "TREND",
    CREATED_AT: "CREATED_AT",
    PRICE: "PRICE",
  },
}));
jest.mock(
  "@/components/waves/leaderboard/header/WaveleaderboardHeader",
  () => ({
    WaveLeaderboardHeader: ({
      onSortChange,
      onPriceRangeChange,
      additionalActionOnly,
      onAdditionalActionChange,
    }: {
      onSortChange: (sort: string) => void;
      additionalActionOnly: boolean;
      onAdditionalActionChange?: (checked: boolean) => void;
      onPriceRangeChange?: (range: {
        minPrice: number;
        maxPrice: number;
      }) => void;
    }) => (
      <div>
        Existing toolbar
        {onAdditionalActionChange && (
          <input
            type="checkbox"
            aria-label="Additional Action"
            checked={additionalActionOnly}
            onChange={(event) => onAdditionalActionChange(event.target.checked)}
          />
        )}
        <button onClick={() => onSortChange("PRICE")}>Price</button>
        {onPriceRangeChange && (
          <button
            onClick={() => onPriceRangeChange({ minPrice: 0.1, maxPrice: 2 })}
          >
            Price range
          </button>
        )}
      </div>
    ),
  })
);
jest.mock("@/components/waves/leaderboard/WaveLeaderboardTime", () => ({
  WaveLeaderboardTime: () => <div>Rank schedule</div>,
}));
jest.mock("@/components/waves/approval/WaveApprovalStatusBar", () => ({
  __esModule: true,
  default: ({ approvedCount }: { approvedCount: number }) => (
    <div>Approved: {approvedCount}</div>
  ),
}));
jest.mock(
  "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop",
  () => ({
    DefaultWaveLeaderboardDrop: ({
      winningThreshold,
      winningThresholdMinDurationMs,
    }: {
      winningThreshold: number | null;
      winningThresholdMinDurationMs: number;
    }) => (
      <div>
        Rich card {winningThreshold ?? "rank"} {winningThresholdMinDurationMs}
      </div>
    ),
  })
);
jest.mock(
  "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem",
  () => ({ WaveLeaderboardGridItem: () => null })
);
jest.mock("@/components/competitions/CompetitionLoadMore", () => ({
  CompetitionLoadMore: () => null,
}));
jest.mock("@/components/competitions/CompetitionState", () => ({
  CompetitionState: () => null,
}));
beforeEach(() => {
  mockType = "RANK";
  mockCapabilities = [];
  mockResource.mockClear();
  localStorage.clear();
  mockDropError = null;
});
it("uses the existing Rank schedule, controls and cards", () => {
  mockType = "RANK";
  render(<CompetitionLeaderboard />);
  expect(screen.getByText("Rank schedule")).toBeVisible();
  expect(screen.getByText("Existing toolbar")).toBeVisible();
  expect(screen.getByText("Rich card rank 5000")).toBeVisible();
  expect(
    screen.queryByRole("checkbox", { name: "Additional Action" })
  ).toBeNull();
});
it("scopes Additional Action filtering to Main Stage without changing sorting", () => {
  mockCapabilities = ["MAIN_STAGE"];
  render(<CompetitionLeaderboard />);
  const toggle = screen.getByRole("checkbox", { name: "Additional Action" });
  expect(toggle).not.toBeChecked();
  fireEvent.click(toggle);
  expect(mockResource).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "comp" },
    "leaderboard",
    expect.objectContaining({
      is_additional_action_promised: "true",
      sort: "rating",
    })
  );
  fireEvent.click(screen.getByRole("button", { name: /^Price$/ }));
  expect(mockResource).toHaveBeenCalledWith(
    expect.anything(),
    "leaderboard",
    expect.objectContaining({
      is_additional_action_promised: "true",
      sort: "price",
    })
  );
  fireEvent.click(toggle);
  expect(latestLeaderboardParams()).not.toHaveProperty(
    "is_additional_action_promised"
  );
  expect(latestLeaderboardParams().sort).toBe("price");
});
it("retains loaded artwork during a temporary refresh failure but hides it when access is revoked", () => {
  const { rerender } = render(<CompetitionLeaderboard />);
  expect(screen.getByText("Rich card rank 5000")).toBeVisible();
  mockDropError = { status: 503 };
  rerender(<CompetitionLeaderboard />);
  expect(screen.getByText("Rich card rank 5000")).toBeVisible();
  mockDropError = { status: 403 };
  rerender(<CompetitionLeaderboard />);
  expect(screen.queryByText("Rich card rank 5000")).not.toBeInTheDocument();
});
it("uses the existing Approve status and threshold presentation", () => {
  mockType = "APPROVE";
  render(<CompetitionLeaderboard />);
  expect(screen.getByText("Approved: 0")).toBeVisible();
  expect(screen.queryByText("Rank schedule")).toBeNull();
  expect(screen.getByText("Rich card 100 5000")).toBeVisible();
});

jest.mock("@/components/waves/leaderboard/leaderboardRendererRegistry", () => ({
  useWaveLeaderboardRendererSet: () => ({
    LeaderboardDrop: jest.requireMock(
      "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop"
    ).DefaultWaveLeaderboardDrop,
  }),
}));
jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem",
  () => ({ WaveLeaderboardGalleryItem: () => null })
);

jest.mock(
  "@/components/waves/leaderboard/WaveLeaderboardVirtualizedRows",
  () => ({
    WaveLeaderboardVirtualizedRows: ({
      items,
      renderItem,
    }: {
      items: { entry_id: string }[];
      renderItem: (item: unknown) => React.ReactNode;
    }) => (
      <>
        {items.map((item) => (
          <div key={item.entry_id}>{renderItem(item)}</div>
        ))}
      </>
    ),
  })
);

it("keeps curation price filtering and sorting scoped to the selected competition", () => {
  mockCapabilities = ["CURATION"];
  render(<CompetitionLeaderboard />);
  fireEvent.click(screen.getByRole("button", { name: "Price range" }));
  fireEvent.click(screen.getByRole("button", { name: /^Price$/ }));
  expect(mockResource).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "comp" },
    "leaderboard",
    {
      sort: "price",
      include: "cards",
      direction: "ASC",
      price_currency: "ETH",
      min_price: "0.1",
      max_price: "2",
    }
  );
});
