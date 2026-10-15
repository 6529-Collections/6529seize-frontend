import { render, screen, waitFor } from "@testing-library/react";
import NextgenCollectionMintingPlan from "@/components/nextGen/collections/collectionParts/mint/NextgenCollectionMintingPlan";

jest.mock("next/dynamic", () => () => () => <div data-testid="pdf" />);

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({
    __esModule: true,
    default: () => <div data-testid="header" />,
    NextGenBackToCollectionPageLink: () => <div data-testid="back" />,
  })
);
jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination">
    <button onClick={() => props.setPage(props.page + 1)}>next</button>
  </div>
));
jest.mock("@/components/searchModal/SearchModal", () => ({
  SearchModalDisplay: () => <div data-testid="search-modal" />,
  SearchWalletsDisplay: () => <div data-testid="search-wallets" />,
}));

const { commonApiFetch } = require("@/services/api/common-api");

const collection = {
  id: 1,
  name: "COL",
  public_start: 0,
  public_end: 0,
  distribution_plan: "plan.pdf",
} as any;
const phases = [{ phase: "Phase1", start_time: 0, end_time: 0 }];
const allowlist = [
  {
    address: "0x1",
    keccak: "k1",
    spots: 1,
    info: "{}",
    phase: "Phase1",
    wallet_display: "",
  },
  {
    address: "0x1",
    keccak: "k2",
    spots: 3,
    info: "{}",
    phase: "Phase1",
    wallet_display: "",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (commonApiFetch as jest.Mock).mockImplementation(({ endpoint }: any) => {
    if (endpoint.startsWith("nextgen/allowlist_phases"))
      return Promise.resolve(phases);
    return Promise.resolve({
      count: allowlist.length,
      page: 1,
      next: null,
      data: allowlist,
    });
  });
});

describe("NextgenCollectionMintingPlan", () => {
  it("computes adjusted spots per address", async () => {
    render(<NextgenCollectionMintingPlan collection={collection} />);
    await screen.findAllByText("0x1");
    const rows = screen.getAllByRole("row");
    expect(rows.some((r) => r.textContent?.includes("Phase1"))).toBe(true);
    await waitFor(() => {
      const cells = screen.getAllByText(/^[0-9]+$/);
      expect(cells.map((c) => c.textContent)).toEqual(
        expect.arrayContaining(["1", "2"])
      );
    });
  });

  it("labels phase start and end times as UTC", async () => {
    (commonApiFetch as jest.Mock).mockImplementation(
      ({ endpoint }: { endpoint: string }) =>
        endpoint.startsWith("nextgen/allowlist_phases")
          ? Promise.resolve([
              {
                phase: "Allowlist",
                // Seconds, as the API returns them.
                start_time: Date.UTC(2026, 9, 12, 11, 27, 11) / 1000,
                end_time: Date.UTC(2026, 9, 13, 23, 30, 0) / 1000,
              },
            ])
          : Promise.resolve({ count: 0, page: 1, next: null, data: [] })
    );

    render(<NextgenCollectionMintingPlan collection={collection} />);

    expect(
      await screen.findByText("2026-10-12 11:27:11 UTC")
    ).toBeInTheDocument();
    expect(screen.getByText("2026-10-13 23:30:00 UTC")).toBeInTheDocument();
    // A phase without a time still reads N/A, with no zone attached.
    expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
  });
});
