import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenCollectionProvenance, {
  NextGenCollectionProvenanceRow,
} from "@/components/nextGen/collections/collectionParts/NextGenCollectionProvenance";
import type { NextGenCollection, NextGenLog } from "@/entities/INextgen";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (p: any) => <img {...p} />,
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/latest-activity/LatestActivityRow", () => ({
  __esModule: true,
  default: (props: any) => (
    <tr
      data-testid="activity-row"
      data-show-nft-identity={props.showNftIdentity ? "true" : "false"}
      data-collection-id={props.nextgen_collection?.id}
    >
      <td>{props.tr.token_id}</td>
    </tr>
  ),
  printGas: () => null,
  printRoyalties: () => null,
}));
jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <button data-testid="page" onClick={() => props.setPage(props.page + 1)}>
    next
  </button>
));
const { commonApiFetch } = require("@/services/api/common-api");
const collection: NextGenCollection = { id: 1, name: "Coll" } as any;
const log: NextGenLog = {
  id: 1,
  block_timestamp: 1,
  log: "test",
  heading: "H",
  transaction: "0x",
  collection_id: 1,
  from_address: "0x",
  to_address: "0x",
  from_display: "",
  to_display: "",
  value: 0,
  royalties: 0,
  gas: 0,
  gas_price: 0,
  gas_gwei: 0,
} as any;

function setup(response = { count: 25, page: 1, next: null, data: [log] }) {
  (commonApiFetch as jest.Mock).mockResolvedValue(response);
  return render(<NextGenCollectionProvenance collection={collection} />);
}

describe("NextGenCollectionProvenance", () => {
  beforeEach(() => jest.clearAllMocks());

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: jest.fn(),
      configurable: true,
    });
  });
  it("fetches logs and handles pagination", async () => {
    setup();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `nextgen/collections/1/logs?page_size=20&page=1`,
    });
    await screen.findByText("test");
    const btn = screen.getByTestId("page");
    (commonApiFetch as jest.Mock).mockResolvedValue({
      count: 25,
      page: 2,
      next: null,
      data: [log],
    });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(commonApiFetch).toHaveBeenLastCalledWith({
        endpoint: `nextgen/collections/1/logs?page_size=20&page=2`,
      });
    });
  });

  it("renders token events with the revised activity row and NFT identity", async () => {
    setup({
      count: 1,
      page: 1,
      next: null,
      data: [{ ...log, token_id: 10000000005 }],
    });

    const activityRow = await screen.findByTestId("activity-row");
    expect(activityRow).toHaveAttribute("data-show-nft-identity", "true");
    expect(activityRow).toHaveAttribute("data-collection-id", "1");
    expect(activityRow).toHaveTextContent("10000000005");
  });

  it("centers pagination like the NFT activity page", async () => {
    setup();

    const pagination = await screen.findByTestId("page");
    expect(pagination.parentElement).toHaveClass("tw-text-center");
    expect(pagination.parentElement).not.toHaveClass("tw-flex");
  });

  it("ignores an older response after the collection changes", async () => {
    let resolveFirst: (value: any) => void = () => {};
    let resolveSecond: (value: any) => void = () => {};
    (commonApiFetch as jest.Mock)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        })
      );

    const { rerender } = render(
      <NextGenCollectionProvenance collection={collection} />
    );
    const nextCollection = { ...collection, id: 2 };
    rerender(<NextGenCollectionProvenance collection={nextCollection} />);

    await act(async () => {
      resolveSecond({
        count: 1,
        page: 1,
        next: null,
        data: [{ ...log, id: 2, token_id: 20000000002 }],
      });
    });
    expect(await screen.findByText("20000000002")).toBeInTheDocument();

    await act(async () => {
      resolveFirst({
        count: 1,
        page: 1,
        next: null,
        data: [{ ...log, id: 1, token_id: 10000000001 }],
      });
    });
    expect(screen.queryByText("10000000001")).not.toBeInTheDocument();
    expect(screen.getByText("20000000002")).toBeInTheDocument();
  });

  it("shows a retry action after a provenance request fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (commonApiFetch as jest.Mock)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ count: 1, page: 1, next: null, data: [log] });

    render(<NextGenCollectionProvenance collection={collection} />);

    expect(
      await screen.findByText("Unable to load collection provenance.")
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("test")).toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });

  it("derives legacy transaction rendering from the current log", () => {
    const transactionLog = {
      ...log,
      log: "Transfer of Coll #5",
      from_address: "0xfrom",
      from_display: "From",
      to_address: "0xto",
      to_display: "To",
    };
    const { container, rerender } = render(
      <NextGenCollectionProvenanceRow
        collection={collection}
        log={transactionLog}
      />
    );

    expect(container.querySelector("details")).not.toBeInTheDocument();
    expect(container).toHaveTextContent("from From");
    expect(container).toHaveTextContent("to To");

    rerender(
      <NextGenCollectionProvenanceRow
        collection={collection}
        log={{ ...transactionLog, log: "Metadata updated" }}
      />
    );

    expect(container.querySelector("details")).toBeInTheDocument();
    expect(container).toHaveTextContent("Metadata updated");
  });

  it("renders an event without a placeholder separator or empty disclosure", () => {
    const { container } = render(
      <table>
        <tbody>
          <NextGenCollectionProvenanceRow
            collection={collection}
            log={{ ...log, heading: "Approve", log: "" }}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.queryByText("•")).not.toBeInTheDocument();
    expect(container.querySelector("details")).not.toBeInTheDocument();
    expect(screen.getByText("Approve").closest("td")).toHaveAttribute(
      "colspan",
      "3"
    );
  });

  it("derives a visible script summary and keeps the payload supplemental", () => {
    const { container } = render(
      <table>
        <tbody>
          <NextGenCollectionProvenanceRow
            collection={collection}
            log={{
              ...log,
              heading: "",
              log: "Script at index 1 updated to: const art = true;",
            }}
          />
        </tbody>
      </table>
    );

    const summary = screen.getByText("Script at index 1 Updated");
    expect(summary.closest("summary")).toBeInTheDocument();
    expect(container.querySelector("details")).toBeInTheDocument();
    expect(
      screen.getByText("Script at index 1 updated to: const art = true;")
    ).toBeInTheDocument();
    expect(screen.queryByText("•")).not.toBeInTheDocument();
  });
});
