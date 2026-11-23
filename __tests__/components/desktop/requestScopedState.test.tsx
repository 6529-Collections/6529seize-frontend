import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useCheckResult,
  useScopedFlag,
} from "@/components/desktop/requestScopedState";

const client = {};

describe("useCheckResult", () => {
  it("returns a result only for the request and round it was made for", async () => {
    const run = jest.fn(async () => "ok");
    const { result, rerender } = renderHook(
      ({ key, round }) => useCheckResult(key, client, run, round),
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

  it("runs again for a new client and never brings back an older run", async () => {
    const runs: ((value: string) => void)[] = [];
    const run = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          runs.push(resolve);
        })
    );
    const other = {};
    const { result, rerender } = renderHook(
      ({ key, owner }) => useCheckResult(key, owner, run, 0),
      { initialProps: { key: "a", owner: client as object } }
    );
    await act(async () => runs[0]!("a ok"));
    expect(result.current).toBe("a ok");
    // Same request, another client: the old result is gone, a new run starts.
    rerender({ key: "a", owner: other });
    expect(result.current).toBeNull();
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    await act(async () => runs[1]!("a on other"));
    expect(result.current).toBe("a on other");
    // A -> B -> A before B answers: A's earlier result does not come back.
    rerender({ key: "b", owner: other });
    rerender({ key: "a", owner: other });
    expect(result.current).toBeNull();
    await waitFor(() => expect(run).toHaveBeenCalledTimes(4));
    await act(async () => runs[2]!("late b"));
    expect(result.current).toBeNull();
    await act(async () => runs[3]!("a again"));
    expect(result.current).toBe("a again");
  });

  it("skips the check without a runner", () => {
    const { result } = renderHook(() => useCheckResult("a", client, null, 0));
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
    rerender({ key: "a" });
    expect(result.current[0]).toBe(false);
  });
});
