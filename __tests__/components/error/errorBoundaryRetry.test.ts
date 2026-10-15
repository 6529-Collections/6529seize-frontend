import { getErrorBoundaryRetry } from "@/components/error/errorBoundaryRetry";

describe("getErrorBoundaryRetry", () => {
  const reset = jest.fn();

  it("uses the stable retry exposed by Next 16.3+", () => {
    const retry = jest.fn();

    expect(getErrorBoundaryRetry({ retry, reset })).toBe(retry);
  });

  it("uses unstable_retry exposed by Next 16.2", () => {
    const unstableRetry = jest.fn();

    expect(
      getErrorBoundaryRetry({ unstable_retry: unstableRetry, reset })
    ).toBe(unstableRetry);
  });

  it("prefers retry when both names are present", () => {
    const retry = jest.fn();
    const unstableRetry = jest.fn();

    expect(
      getErrorBoundaryRetry({ retry, unstable_retry: unstableRetry, reset })
    ).toBe(retry);
  });

  it("falls back to reset when neither retry name is present", () => {
    expect(getErrorBoundaryRetry({ reset })).toBe(reset);
    expect(
      getErrorBoundaryRetry({
        retry: undefined,
        unstable_retry: undefined,
        reset,
      })
    ).toBe(reset);
  });
});
