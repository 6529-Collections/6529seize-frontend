import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useCheckResult,
  useScopedFlag,
} from "@/components/desktop/requestScopedState";

describe("useCheckResult", () => {
  it("returns a result only for the request and round it was made for", async () => {
    const run = jest.fn(async () => "ok");
    const { result, rerender } = renderHook(
      ({ key, round }) => useCheckResult(key, run, round),
      { initialProps: { key: "a", round: 0 } }
    );
    await waitFor(() => expect(result.current).toBe("ok"));
    let release: (value: string) => void = () => undefined;
    run.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        })
    );
    rerender({ key: "b", round: 0 });
    expect(result.current).toBeNull();
    await act(async () => release("b ok"));
    expect(result.current).toBe("b ok");
    rerender({ key: "b", round: 1 });
    expect(result.current).toBeNull();
    await act(async () => release("b again"));
    expect(result.current).toBe("b again");
  });

  it("skips the check without a runner", () => {
    const { result } = renderHook(() => useCheckResult("a", null, 0));
    expect(result.current).toBeNull();
  });
});

describe("useScopedFlag", () => {
  it("clears a yes when the request changes", () => {
    const { result, rerender } = renderHook(({ key }) => useScopedFlag(key), {
      initialProps: { key: "a" },
    });
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    rerender({ key: "b" });
    expect(result.current[0]).toBe(false);
  });
});
