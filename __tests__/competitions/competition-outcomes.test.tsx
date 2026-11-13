import { fireEvent, render, screen } from "@testing-library/react";
import CompetitionOutcomes from "@/components/competitions/CompetitionOutcomes";
import { formatOutcomePositions } from "@/helpers/competition-outcomes.helpers";

const mockOutcomes = {
  data: { pages: [{ data: [] as object[] }] },
  isPending: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
};
const mockDistribution = {
  data: { pages: [{ data: [] as object[] }] },
  isPending: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
};
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({ competition: { id: "decision", wave_id: "wave" } }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionResource: () => mockOutcomes,
  useCompetitionViewer: () => "public",
}));
jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: () => mockDistribution,
}));

beforeEach(() => {
  for (const query of [mockOutcomes, mockDistribution]) {
    query.isPending = false;
    query.isError = false;
    query.hasNextPage = false;
    query.fetchNextPage.mockClear();
  }
  mockOutcomes.data.pages[0]!.data = [];
  mockDistribution.data.pages[0]!.data = [];
});

it("omits the Settings block when no outcomes are configured", () => {
  const { container } = render(<CompetitionOutcomes />);
  expect(container).toBeEmptyDOMElement();
});

it("groups repeated manual descriptions and keeps distinct positions readable", () => {
  mockOutcomes.data.pages[0]!.data = [
    { id: "prize", description: "Print", credit: null },
  ];
  mockDistribution.data.pages[0]!.data = [
    { position: 1, amount: 1, description: "Print" },
    { position: 2, amount: 1, description: "Print" },
    { position: 3, amount: 0, description: "Print" },
    { position: 4, amount: 1, description: "Signed print" },
  ];
  render(<CompetitionOutcomes />);
  expect(screen.getByRole("region", { name: "Outcomes" })).toBeVisible();
  expect(screen.getAllByText("Print", { exact: true })).toHaveLength(1);
  expect(screen.getByText("Positions 1–2")).toBeVisible();
  expect(screen.getByText("Positions 4")).toBeVisible();
  expect(screen.queryByText("Manual")).toBeNull();
  expect(screen.queryByText(/No winners yet/i)).toBeNull();
});

it.each([
  ["REP", "Rep", "Art"],
  ["CIC", "NIC", null],
])(
  "retains historical %s amounts and categories",
  (credit, label, category) => {
    mockOutcomes.data.pages[0]!.data = [
      {
        id: "prize",
        description: "",
        credit,
        rep_category: category,
        amount: 100,
      },
    ];
    render(<CompetitionOutcomes />);
    expect(
      screen.getByText(category ? `100 ${label} · ${category}` : `100 ${label}`)
    ).toBeVisible();
  }
);

it("compresses large winner distributions without losing gaps", () => {
  expect(formatOutcomePositions([5, 1, 2, 2, 3, 7, 8, 9], "en-US")).toBe(
    "1–3, 5, 7–9"
  );
});

it("retains the configured description when per-position text differs", () => {
  mockOutcomes.data.pages[0]!.data = [
    { id: "prize", description: "Awards", credit: null },
  ];
  mockDistribution.data.pages[0]!.data = [
    { position: 1, amount: 1, description: "Signed print" },
  ];
  render(<CompetitionOutcomes />);
  expect(screen.getByText("Awards", { exact: true })).toBeVisible();
  expect(screen.getByText("Signed print", { exact: true })).toBeVisible();
});

it("keeps a manual description without inventing zero-amount reward positions", () => {
  mockOutcomes.data.pages[0]!.data = [
    { id: "prize", description: "Recognition", credit: null },
  ];
  mockDistribution.data.pages[0]!.data = [
    { position: 1, amount: 0, description: "Recognition" },
  ];
  render(<CompetitionOutcomes />);
  expect(screen.getByText("Recognition", { exact: true })).toBeVisible();
  expect(screen.queryByText(/Positions/)).toBeNull();
});

it("keeps outcome and position pagination separate", () => {
  mockOutcomes.data.pages[0]!.data = [
    { id: "prize", description: "Print", credit: null },
  ];
  mockOutcomes.hasNextPage = true;
  mockDistribution.hasNextPage = true;
  render(<CompetitionOutcomes />);
  fireEvent.click(screen.getByRole("button", { name: "Load more positions" }));
  expect(mockDistribution.fetchNextPage).toHaveBeenCalledTimes(1);
  expect(mockOutcomes.fetchNextPage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Load more outcomes" }));
  expect(mockOutcomes.fetchNextPage).toHaveBeenCalledTimes(1);
});

it.each(["pending", "error"])(
  "shows no fallback credit amount while distribution is %s",
  (state) => {
    mockOutcomes.data.pages[0]!.data = [
      { id: "prize", description: "", credit: "REP", amount: null },
    ];
    mockDistribution.isPending = state === "pending";
    mockDistribution.isError = state === "error";
    render(<CompetitionOutcomes />);
    expect(screen.queryByText(/0 Rep/)).toBeNull();
    expect(
      screen.getByRole(state === "pending" ? "status" : "alert")
    ).toBeVisible();
  }
);
