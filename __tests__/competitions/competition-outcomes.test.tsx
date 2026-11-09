import { render, screen } from "@testing-library/react";
import CompetitionOutcomes from "@/components/competitions/CompetitionOutcomes";
import { formatOutcomePositions } from "@/helpers/competition-outcomes.helpers";

const mockOutcomes = {
  data: { pages: [{ data: [] as object[] }] },
  isPending: false,
  isError: false,
  hasNextPage: false,
};
const mockDistribution = {
  data: { pages: [{ data: [] as object[] }] },
  isPending: false,
  isError: false,
  hasNextPage: false,
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
