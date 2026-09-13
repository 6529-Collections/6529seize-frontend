import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import MarketDepthPanel from "@/components/nft-market-depth/MarketDepthPanel";
import { commonApiFetch } from "@/services/api/common-api";
import {
  ApiMarketDepthStatusEnum,
  type ApiMarketDepth,
} from "@/generated/models/ApiMarketDepth";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/nft-market-depth/MarketDepthTradeActions", () => ({
  MarketDepthTradeProvider: ({
    children,
    onInteractionChange,
  }: {
    children: ReactNode;
    onInteractionChange: (busy: boolean) => void;
  }) => {
    const [remembered, setRemembered] = useState(0);
    return (
      <div data-testid="mounted-trade-provider">
        <button onClick={() => setRemembered((value) => value + 1)}>
          Remember {remembered}
        </button>
        <button onClick={() => onInteractionChange(true)}>Start review</button>
        <button onClick={() => onInteractionChange(false)}>
          Finish review
        </button>
        {children}
      </div>
    );
  },
}));

const fetchMock = jest.mocked(commonApiFetch);
function book(note = "Original observed book"): ApiMarketDepth {
  return {
    contract: "0x1",
    token_id: "7",
    status: ApiMarketDepthStatusEnum.Fresh,
    as_of: new Date(),
    snapshots: [],
    books: [],
    orders: [],
    order_count: 0,
    next: null,
    criteria_order_count: 0,
    notes: [note],
  };
}
beforeEach(() => {
  jest.useFakeTimers();
  fetchMock.mockReset();
});
afterEach(() => jest.useRealTimers());

it("updates a healthy book quietly without remounting its trade state", async () => {
  fetchMock
    .mockResolvedValueOnce(book())
    .mockResolvedValue(book("New observed book"));
  render(<MarketDepthPanel contract="0x1" tokenId="7" embedded />);
  await screen.findByText("Original observed book");
  const provider = screen.getByTestId("mounted-trade-provider");
  fireEvent.click(screen.getByRole("button", { name: "Remember 0" }));
  expect(
    screen.queryByRole("button", { name: /refresh/i })
  ).not.toBeInTheDocument();
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(screen.getByText("New observed book")).toBeInTheDocument();
  expect(screen.getByTestId("mounted-trade-provider")).toBe(provider);
  expect(
    screen.getByRole("button", { name: "Remember 1" })
  ).toBeInTheDocument();
});

it.each(["success", "failure"])(
  "discards late background %s after review starts and ends",
  async (outcome) => {
    let resolveRead!: (value: ApiMarketDepth) => void;
    let rejectRead!: (reason: Error) => void;
    fetchMock.mockResolvedValueOnce(book()).mockReturnValueOnce(
      new Promise<ApiMarketDepth>((resolve, reject) => {
        resolveRead = resolve;
        rejectRead = reject;
      })
    );
    render(<MarketDepthPanel contract="0x1" tokenId="7" embedded />);
    await screen.findByText("Original observed book");
    const provider = screen.getByTestId("mounted-trade-provider");
    await act(async () => jest.advanceTimersByTimeAsync(60_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Start review" }));
    await act(async () => jest.advanceTimersByTimeAsync(60_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Finish review" }));
    await act(async () => {
      if (outcome === "success") resolveRead(book("Obsolete book"));
      else rejectRead(new Error("old read failed"));
    });
    expect(screen.getByText("Original observed book")).toBeInTheDocument();
    expect(screen.queryByText("Obsolete book")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("mounted-trade-provider")).toBe(provider);
  }
);

it("retains the last book on background failure and retries without replacing its provider", async () => {
  fetchMock
    .mockResolvedValueOnce(book())
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(book("Recovered book"));
  render(<MarketDepthPanel contract="0x1" tokenId="7" embedded />);
  await screen.findByText("Original observed book");
  const provider = screen.getByTestId("mounted-trade-provider");
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText("Original observed book")).toBeInTheDocument();
  expect(screen.getByTestId("mounted-trade-provider")).toBe(provider);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("Recovered book");
  expect(screen.getByTestId("mounted-trade-provider")).toBe(provider);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("replaces an expired background request and rejects its late book without releasing the newer request", async () => {
  let finishOld!: (value: ApiMarketDepth) => void;
  let finishNew!: (value: ApiMarketDepth) => void;
  fetchMock
    .mockResolvedValueOnce(book())
    .mockReturnValueOnce(
      new Promise<ApiMarketDepth>((resolve) => {
        finishOld = resolve;
      })
    )
    .mockReturnValueOnce(
      new Promise<ApiMarketDepth>((resolve) => {
        finishNew = resolve;
      })
    );
  render(<MarketDepthPanel contract="0x1" tokenId="7" embedded />);
  await screen.findByText("Original observed book");
  const provider = screen.getByTestId("mounted-trade-provider");
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(fetchMock).toHaveBeenCalledTimes(3);
  await act(async () => finishOld(book("Obsolete timed-out book")));
  expect(screen.queryByText("Obsolete timed-out book")).not.toBeInTheDocument();
  expect(screen.getByText("Original observed book")).toBeInTheDocument();
  await act(async () => finishNew(book("Recovered current book")));
  expect(screen.getByText("Recovered current book")).toBeInTheDocument();
  expect(screen.getByTestId("mounted-trade-provider")).toBe(provider);
});
