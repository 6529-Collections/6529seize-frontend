import { useMarketSettlement } from "@/components/collect/useMarketSettlement";
import { renderHook } from "@testing-library/react";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";

const mockInvalidate = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
beforeEach(() => jest.clearAllMocks());
it("refreshes holdings and clears the old plan once a polled receipt confirms", () => {
  const settled = jest.fn();
  const submitted = {
    id: "operation",
    state: "SUBMITTED",
  } as ApiMarketOperation;
  const confirmed = { ...submitted, state: "CONFIRMED" } as ApiMarketOperation;
  const { rerender } = renderHook(
    ({ operation }) => useMarketSettlement(operation, settled),
    { initialProps: { operation: submitted } }
  );
  expect(settled).not.toHaveBeenCalled();
  rerender({ operation: confirmed });
  expect(settled).toHaveBeenCalledTimes(1);
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ["PROFILE_COLLECTED"],
  });
  rerender({ operation: confirmed });
  expect(settled).toHaveBeenCalledTimes(1);
});

it.each(["LIVE", "CONFIRMED", "CANCELLED"])(
  "refreshes the artwork market once for %s without treating every market change as an acquisition",
  (state) => {
    const settled = jest.fn();
    const marketChanged = jest.fn();
    const initial = {
      id: "operation",
      state: "REVIEW",
    } as ApiMarketOperation;
    const completed = { ...initial, state } as ApiMarketOperation;
    const { rerender } = renderHook(
      ({ operation }) => useMarketSettlement(operation, settled, marketChanged),
      { initialProps: { operation: initial } }
    );
    expect(marketChanged).not.toHaveBeenCalled();
    rerender({ operation: completed });
    rerender({ operation: completed });
    expect(marketChanged).toHaveBeenCalledTimes(1);
    expect(settled).toHaveBeenCalledTimes(state === "CONFIRMED" ? 1 : 0);
  }
);

it.each(["REVIEW", "SUBMITTED", "MINED", "FAILED", "UNKNOWN", "CANCEL_PENDING"])(
  "does not invent a market update from %s",
  (state) => {
    const marketChanged = jest.fn();
    renderHook(() =>
      useMarketSettlement(
        { id: "operation", state } as ApiMarketOperation,
        undefined,
        marketChanged
      )
    );
    expect(marketChanged).not.toHaveBeenCalled();
  }
);
