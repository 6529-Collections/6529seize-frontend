import { renderHook } from "@testing-library/react";
import { useStableCallback, useStableList } from "@/hooks/useStableIdentity";

describe("useStableCallback", () => {
  it("keeps its identity and runs the latest implementation", () => {
    const { result, rerender } = renderHook(
      ({ offset }) => useStableCallback((value: number) => value + offset),
      { initialProps: { offset: 1 } }
    );
    const first = result.current;
    expect(first(1)).toBe(2);

    rerender({ offset: 10 });

    expect(result.current).toBe(first);
    expect(first(1)).toBe(11);
  });
});

describe("useStableList", () => {
  const item = (id: string, count: number) => ({ id, count });

  it("keeps the previous list while its items are shallowly equal", () => {
    const { result, rerender } = renderHook(({ list }) => useStableList(list), {
      initialProps: { list: [item("a", 1), item("b", 2)] },
    });
    const first = result.current;

    rerender({ list: [item("a", 1), item("b", 2)] });

    expect(result.current).toBe(first);
  });

  it("returns a new list that reuses the unchanged items", () => {
    const { result, rerender } = renderHook(({ list }) => useStableList(list), {
      initialProps: { list: [item("a", 1), item("b", 2)] },
    });
    const first = result.current;

    rerender({ list: [item("a", 1), item("b", 3)] });

    expect(result.current).not.toBe(first);
    expect(result.current[0]).toBe(first[0]);
    expect(result.current[1]).toEqual(item("b", 3));
  });

  it("returns a new list when the length changes", () => {
    const { result, rerender } = renderHook(({ list }) => useStableList(list), {
      initialProps: { list: [item("a", 1), item("b", 2)] },
    });
    const first = result.current;

    rerender({ list: [item("a", 1)] });

    expect(result.current).not.toBe(first);
    expect(result.current).toEqual([item("a", 1)]);
    expect(result.current[0]).toBe(first[0]);
  });

  it("compares primitive items by value", () => {
    const { result, rerender } = renderHook(({ list }) => useStableList(list), {
      initialProps: { list: ["a", "b"] },
    });
    const first = result.current;

    rerender({ list: ["a", "b"] });
    expect(result.current).toBe(first);

    rerender({ list: ["a", "c"] });
    expect(result.current).toEqual(["a", "c"]);
  });
});
