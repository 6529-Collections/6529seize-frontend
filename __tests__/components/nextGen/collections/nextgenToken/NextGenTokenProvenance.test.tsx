import NextGenTokenProvenance from "@/components/nextGen/collections/nextgenToken/NextGenTokenProvenance";
import { NEXTGEN_CONTRACT } from "@/constants/constants";
import type { NextGenCollection } from "@/entities/INextgen";
import { commonApiFetch } from "@/services/api/common-api";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/nft-market-activity/NftMarketActivity", () => ({
  __esModule: true,
  default: ({ contract, tokenId }: { contract: string; tokenId: string }) => (
    <div
      data-testid="nft-market-activity"
      data-contract={contract}
      data-token-id={tokenId}
    />
  ),
}));
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionProvenance",
  () => ({
    NextGenCollectionProvenanceRow: ({ log }: { log: { id: string } }) => (
      <tr data-testid="log-row">
        <td>{log.id}</td>
      </tr>
    ),
  })
);
jest.mock("@/components/pagination/Pagination", () => ({
  __esModule: true,
  default: ({
    page,
    setPage,
  }: {
    page: number;
    setPage: (page: number) => void;
  }) => (
    <button type="button" onClick={() => setPage(page + 1)}>
      next
    </button>
  ),
}));

const mockFetch = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;
const collection = { id: 1, name: "Test Collection" } as NextGenCollection;
const log = { id: "l1", block: 1 };

describe("NextGenTokenProvenance", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: jest.fn(),
      configurable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ count: 26, data: [log] });
  });

  it("renders merged token activity and collection provenance", async () => {
    render(<NextGenTokenProvenance collection={collection} token_id={7} />);

    expect(
      screen.getByRole("heading", { name: "Card Activity" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-contract",
      NEXTGEN_CONTRACT
    );
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-token-id",
      "7"
    );
    expect(await screen.findByTestId("log-row")).toHaveTextContent("l1");
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "nextgen/collections/1/logs/7?page_size=25&page=1",
    });
  });

  it("paginates collection provenance independently", async () => {
    render(<NextGenTokenProvenance collection={collection} token_id={7} />);
    await screen.findByTestId("log-row");
    await userEvent.click(screen.getByRole("button", { name: "next" }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith({
        endpoint: "nextgen/collections/1/logs/7?page_size=25&page=2",
      })
    );
  });

  it("ignores stale log responses after the token changes", async () => {
    const resolvers: Record<string, (value: unknown) => void> = {};
    mockFetch.mockImplementation(
      ({ endpoint }) =>
        new Promise((resolve) => {
          resolvers[endpoint] = resolve;
        })
    );

    const { rerender } = render(
      <NextGenTokenProvenance collection={collection} token_id={7} />
    );
    rerender(
      <NextGenTokenProvenance
        collection={{ ...collection, id: 2 }}
        token_id={8}
      />
    );

    await act(async () => {
      resolvers["nextgen/collections/2/logs/8?page_size=25&page=1"]?.({
        count: 1,
        data: [{ ...log, id: "l8" }],
      });
    });
    expect(await screen.findByText("l8")).toBeInTheDocument();

    await act(async () => {
      resolvers["nextgen/collections/1/logs/7?page_size=25&page=1"]?.({
        count: 1,
        data: [{ ...log, id: "l7" }],
      });
    });
    expect(screen.queryByText("l7")).not.toBeInTheDocument();
  });

  it("shows a retryable collection provenance error", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    mockFetch.mockRejectedValueOnce(new Error("offline"));
    render(<NextGenTokenProvenance collection={collection} token_id={7} />);

    expect(
      await screen.findByText("Unable to load collection provenance.")
    ).toBeInTheDocument();
    mockFetch.mockResolvedValueOnce({ count: 1, data: [log] });
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("log-row")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
