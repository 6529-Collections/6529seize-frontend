import { renderHook, act } from "@testing-library/react";
import { useDeferredNewestDrops } from "@/components/waves/drops/wave-drops-all/hooks/useDeferredNewestDrops";

const createDrop = (serialNo: number) =>
  ({
    serial_no: serialNo,
    id: `drop-${serialNo}`,
  }) as any;

const createWaveMessages = (serials: number[]) =>
  ({
    drops: serials.map(createDrop),
    isLoading: false,
    isLoadingNextPage: false,
    hasNextPage: false,
  }) as any;

describe("useDeferredNewestDrops", () => {
  it("defers new drops on Apple mobile when leaving pinned mode", () => {
    const { result, rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) =>
        useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        }),
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([1]),
    });

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([1]);
    expect(result.current.pendingDropsCount).toBe(1);

    act(() => {
      result.current.revealPendingDrops();
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([2, 1]);
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("captures the pre-unpin latest serial when unpinning and appending in the same render", () => {
    const { result, rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) =>
        useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        }),
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([1]);
    expect(result.current.pendingDropsCount).toBe(1);

    act(() => {
      result.current.revealPendingDrops();
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([2, 1]);
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("captures the newest pinned serial before later arrivals after unpinning", () => {
    const { result, rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) =>
        useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        }),
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: true,
      waveMessages: createWaveMessages([2, 1]),
    });

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([2, 1]),
    });

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([3, 2, 1]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([2, 1]);
    expect(result.current.pendingDropsCount).toBe(1);

    act(() => {
      result.current.revealPendingDrops();
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([3, 2, 1]);
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("shows newest drops immediately when not on Apple mobile", () => {
    const { result, rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) =>
        useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        }),
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: false,
          shouldPinToBottom: false,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    rerender({
      waveId: "wave-1",
      isAppleMobile: false,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([2, 1]);
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("resets deferred state when wave changes", () => {
    const { result, rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) =>
        useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        }),
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([1]),
    });

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([1]);

    rerender({
      waveId: "wave-2",
      isAppleMobile: true,
      shouldPinToBottom: true,
      waveMessages: createWaveMessages([10, 9]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([10, 9]);
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("clears deferred state when returning to pinned mode", () => {
    const { result, rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) =>
        useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        }),
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([1]),
    });

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([1]);
    expect(result.current.pendingDropsCount).toBe(1);

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: true,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(
      result.current.renderedWaveMessages?.drops.map((drop) => drop.serial_no)
    ).toEqual([2, 1]);
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("does not rerender when revealing the same newest serial twice", () => {
    let renderCount = 0;

    const { result, rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) => {
        renderCount += 1;

        return useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        });
      },
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([1]),
    });

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: false,
      waveMessages: createWaveMessages([2, 1]),
    });

    const rendersBeforeReveal = renderCount;

    act(() => {
      result.current.revealPendingDrops();
    });

    expect(renderCount).toBe(rendersBeforeReveal + 1);
    expect(result.current.pendingDropsCount).toBe(0);

    const rendersBeforeSecondReveal = renderCount;

    act(() => {
      result.current.revealPendingDrops();
    });

    expect(renderCount).toBe(rendersBeforeSecondReveal);
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("keeps pending count at zero while wave messages are undefined", () => {
    const { result } = renderHook(() =>
      useDeferredNewestDrops({
        waveId: "wave-1",
        isAppleMobile: true,
        waveMessages: undefined,
        shouldPinToBottom: false,
      })
    );

    expect(result.current.renderedWaveMessages).toBeUndefined();
    expect(result.current.pendingDropsCount).toBe(0);

    act(() => {
      result.current.revealPendingDrops();
    });

    expect(result.current.renderedWaveMessages).toBeUndefined();
    expect(result.current.pendingDropsCount).toBe(0);
  });

  it("does not add an internal update cycle when inputs are unchanged", () => {
    let renderCount = 0;

    const { rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) => {
        renderCount += 1;

        return useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        });
      },
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    const rendersBeforeRerender = renderCount;

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: true,
      waveMessages: createWaveMessages([1]),
    });

    expect(renderCount).toBe(rendersBeforeRerender + 1);
  });

  it("does not add an internal update cycle for pinned Apple mobile appends", () => {
    let renderCount = 0;

    const { rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) => {
        renderCount += 1;

        return useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        });
      },
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: true,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    const rendersBeforeRerender = renderCount;

    rerender({
      waveId: "wave-1",
      isAppleMobile: true,
      shouldPinToBottom: true,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(renderCount).toBe(rendersBeforeRerender + 1);
  });

  it("does not add an internal update cycle for pinned desktop appends", () => {
    let renderCount = 0;

    const { rerender } = renderHook(
      ({
        isAppleMobile,
        shouldPinToBottom,
        waveId,
        waveMessages,
      }: {
        isAppleMobile: boolean;
        shouldPinToBottom: boolean;
        waveId: string;
        waveMessages: any;
      }) => {
        renderCount += 1;

        return useDeferredNewestDrops({
          waveId,
          isAppleMobile,
          waveMessages,
          shouldPinToBottom,
        });
      },
      {
        initialProps: {
          waveId: "wave-1",
          isAppleMobile: false,
          shouldPinToBottom: true,
          waveMessages: createWaveMessages([1]),
        },
      }
    );

    const rendersBeforeRerender = renderCount;

    rerender({
      waveId: "wave-1",
      isAppleMobile: false,
      shouldPinToBottom: true,
      waveMessages: createWaveMessages([2, 1]),
    });

    expect(renderCount).toBe(rendersBeforeRerender + 1);
  });
});
