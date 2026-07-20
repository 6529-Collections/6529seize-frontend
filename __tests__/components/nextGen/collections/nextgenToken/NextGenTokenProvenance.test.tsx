import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenTokenProvenance from "@/components/nextGen/collections/nextgenToken/NextGenTokenProvenance";
import type { NextGenCollection } from "@/entities/INextgen";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/latest-activity/LatestActivityRow",
  () => (props: any) => <tr data-testid="activity-row">{props.tr.id}</tr>
);

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionProvenance",
  () => ({
    NextGenCollectionProvenanceRow: (props: any) => (
      <tr data-testid="log-row">
        <td>{props.log.id}</td>
      </tr>
    ),
  })
);

jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <div data-testid="pagination">
    <button onClick={() => props.setPage(props.page + 1)}>next</button>
  </div>
));

const { commonApiFetch } = require("@/services/api/common-api");

const collection: NextGenCollection = { id: 1 } as any;
const transaction = {
  id: "t1",
  from_address: "a",
  to_address: "b",
  transaction: "tx",
  token_id: 7,
} as any;
const log = { id: "l1", block: 1 } as any;

function setup() {
  (commonApiFetch as jest.Mock).mockResolvedValue({
    count: 26,
    data: [transaction],
  });
  return render(
    <NextGenTokenProvenance collection={collection} token_id={7} />
  );
}

describe("NextGenTokenProvenance", () => {
  beforeEach(() => jest.clearAllMocks());
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: jest.fn(),
      configurable: true,
    });
  });

  it("fetches provenance data and paginates", async () => {
    setup();
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
    expect(commonApiFetch.mock.calls[0][0]).toEqual({
      endpoint: `nextgen/tokens/7/transactions?page_size=25&page=1`,
    });
    expect(
      commonApiFetch.mock.calls.some(
        (c: any) =>
          c[0].endpoint === `nextgen/collections/1/logs/7?page_size=25&page=1`
      )
    ).toBe(true);

    await screen.findByTestId("activity-row");
    await screen.findByTestId("log-row");

    await userEvent.click(screen.getAllByText("next")[0]);
    await userEvent.click(screen.getAllByText("next")[1]);

    await waitFor(() => {
      expect(
        commonApiFetch.mock.calls.some(
          (c: any) =>
            c[0].endpoint ===
            `nextgen/tokens/7/transactions?page_size=25&page=2`
        )
      ).toBe(true);
      expect(
        commonApiFetch.mock.calls.some(
          (c: any) =>
            c[0].endpoint === `nextgen/collections/1/logs/7?page_size=25&page=2`
        )
      ).toBe(true);
    });
  });

  it("announces token and collection loading states", () => {
    (commonApiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<NextGenTokenProvenance collection={collection} token_id={7} />);

    expect(screen.getByLabelText("Loading token provenance").tagName).toBe(
      "OUTPUT"
    );
    expect(screen.getByLabelText("Loading collection provenance").tagName).toBe(
      "OUTPUT"
    );
  });

  it("ignores stale transaction and log responses after the token changes", async () => {
    const resolvers: Record<string, (value: any) => void> = {};
    (commonApiFetch as jest.Mock).mockImplementation(
      ({ endpoint }: { endpoint: string }) =>
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
      resolvers["nextgen/tokens/8/transactions?page_size=25&page=1"]?.({
        count: 1,
        data: [{ ...transaction, id: "t8", token_id: 8 }],
      });
      resolvers["nextgen/collections/2/logs/8?page_size=25&page=1"]?.({
        count: 1,
        data: [{ ...log, id: "l8" }],
      });
    });

    expect(await screen.findByText("t8")).toBeInTheDocument();
    expect(await screen.findByText("l8")).toBeInTheDocument();

    await act(async () => {
      resolvers["nextgen/tokens/7/transactions?page_size=25&page=1"]?.({
        count: 1,
        data: [{ ...transaction, id: "t7" }],
      });
      resolvers["nextgen/collections/1/logs/7?page_size=25&page=1"]?.({
        count: 1,
        data: [{ ...log, id: "l7" }],
      });
    });

    expect(screen.queryByText("t7")).not.toBeInTheDocument();
    expect(screen.queryByText("l7")).not.toBeInTheDocument();
    expect(screen.getByText("t8")).toBeInTheDocument();
    expect(screen.getByText("l8")).toBeInTheDocument();
  });

  it("shows retryable token and collection errors instead of empty states", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (commonApiFetch as jest.Mock).mockRejectedValue(new Error("offline"));

    render(<NextGenTokenProvenance collection={collection} token_id={7} />);

    expect(
      await screen.findByText("Unable to load token provenance.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Unable to load collection provenance.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No token provenance entries found.")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No collection provenance entries found.")
    ).not.toBeInTheDocument();

    (commonApiFetch as jest.Mock).mockResolvedValue({ count: 1, data: [log] });
    await userEvent.click(screen.getAllByRole("button", { name: "Retry" })[1]!);
    expect(await screen.findByTestId("log-row")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
