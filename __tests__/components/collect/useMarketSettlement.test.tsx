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
