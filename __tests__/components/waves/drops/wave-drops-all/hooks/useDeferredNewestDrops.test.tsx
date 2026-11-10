import { renderHook, act } from "@testing-library/react";
import { useDeferredNewestDrops } from "@/components/waves/drops/wave-drops-all/hooks/useDeferredNewestDrops";
import {
  DropSize,
  type Drop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { ChatStore } from "@/lib/chat-store";

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

type WaveFeed = NonNullable<
  Parameters<typeof useDeferredNewestDrops>[0]["waveMessages"]
>;

const fullDrop = (
  id: string,
  serialNo: number,
  authorId: string,
  withImage = false
): ExtendedDrop =>
  ({
    id,
    serial_no: serialNo,
    created_at: serialNo > 1000 ? serialNo : 1000 + serialNo,
    updated_at: null,
    wave: { id: "wave-1" },
    author: { id: authorId, handle: authorId },
    title: null,
    metadata: [],
    parts: [
      {
        content: `Message ${id}`,
        media: withImage
          ? [{ url: "https://example.com/image.png", mime_type: "image/png" }]
          : [],
      },
    ],
    type: DropSize.FULL,
    stableKey: id,
    stableHash: id,
  }) as unknown as ExtendedDrop;

const feedWithDrops = (drops: Drop[]): WaveFeed =>
  ({
    drops,
    isLoading: false,
    isLoadingNextPage: false,
    hasNextPage: false,
  }) as WaveFeed;

function renderOwnDropScenario() {
  return renderHook(
    ({
      drops,
      pinned,
      viewerProfileId,
    }: {
      drops: Drop[];
      pinned: boolean;
      viewerProfileId?: string | null;
    }) =>
      useDeferredNewestDrops({
        waveId: "wave-1",
        isAppleMobile: true,
        shouldPinToBottom: pinned,
        waveMessages: feedWithDrops(drops),
        viewerProfileId,
      }),
    {
      initialProps: {
        drops: [fullDrop("old", 1, "other")],
        pinned: true,
        viewerProfileId: "viewer",
      },
    }
  );
}

const renderedIds = (
  state: ReturnType<typeof useDeferredNewestDrops>
): string[] => state.renderedWaveMessages?.drops.map((drop) => drop.id) ?? [];

describe("own messages during Apple mobile deferral", () => {
  it("shows pending sends while pinned even before viewer identity resolves", () => {
    const { result, rerender } = renderOwnDropScenario();
    rerender({
      drops: [
        fullDrop("temp-own", Date.now(), "viewer"),
        fullDrop("old", 1, "other"),
      ],
      pinned: true,
      viewerProfileId: null,
    });
    expect(renderedIds(result.current)).toEqual(["temp-own", "old"]);
    expect(result.current.pendingDropsCount).toBe(0);
  });
  it.each([false, true])(
    "keeps pending and accepted own messages with image=%s while incoming messages wait",
    (withImage) => {
      const store = new ChatStore();
      store.merge("wave-1", [fullDrop("old", 1, "other")]);
      const { result, rerender } = renderOwnDropScenario();
      const update = () =>
        rerender({
          drops: store.getDrops("wave-1"),
          pinned: false,
          viewerProfileId: "viewer",
        });
      update();
      store.merge("wave-1", [fullDrop("incoming", 2, "other")]);
      const pending = fullDrop("temp-own", Date.now(), "viewer", withImage);
      store.addPendingSend("wave-1", pending);
      update();
      expect(renderedIds(result.current)).toEqual(["temp-own", "old"]);
      expect(result.current.pendingDropsCount).toBe(1);
      const accepted = { ...pending, id: "saved-own", serial_no: 3 };
      store.settlePendingSend(pending.id, accepted);
      update();
      expect(renderedIds(result.current)).toEqual(["saved-own", "old"]);
      expect(result.current.pendingDropsCount).toBe(1);
      act(() => result.current.revealPendingDrops());
      expect(renderedIds(result.current)).toEqual([
        "saved-own",
        "incoming",
        "old",
      ]);
      expect(result.current.pendingDropsCount).toBe(0);
    }
  );

  it("keeps own messages visible when bottom pinning is lost with the new messages", () => {
    const { result, rerender } = renderOwnDropScenario();
    rerender({
      drops: [
        fullDrop("own", 3, "viewer"),
        fullDrop("incoming", 2, "other"),
        fullDrop("old", 1, "other"),
      ],
      pinned: false,
      viewerProfileId: "viewer",
    });
    expect(renderedIds(result.current)).toEqual(["own", "old"]);
    expect(result.current.pendingDropsCount).toBe(1);
  });

  it("does not let a pinned temporary timestamp reveal later incoming messages", () => {
    const { result, rerender } = renderOwnDropScenario();
    const pending = fullDrop("temp-own", Date.now(), "viewer");
    const old = fullDrop("old", 1, "other");
    rerender({
      drops: [pending, old],
      pinned: true,
      viewerProfileId: "viewer",
    });
    expect(renderedIds(result.current)).toEqual(["temp-own", "old"]);
    rerender({
      drops: [pending, fullDrop("incoming", 2, "other"), old],
      pinned: false,
      viewerProfileId: "viewer",
    });
    expect(renderedIds(result.current)).toEqual(["temp-own", "old"]);
    expect(result.current.pendingDropsCount).toBe(1);
    act(() => result.current.revealPendingDrops());
    expect(result.current.pendingDropsCount).toBe(0);
    rerender({
      drops: [
        pending,
        fullDrop("later", 3, "other"),
        fullDrop("incoming", 2, "other"),
        old,
      ],
      pinned: false,
      viewerProfileId: "viewer",
    });
    expect(renderedIds(result.current)).toEqual([
      "temp-own",
      "incoming",
      "old",
    ]);
    expect(result.current.pendingDropsCount).toBe(1);
  });

  it("updates ownership on profile changes and does not exempt light placeholders", () => {
    const { result, rerender } = renderOwnDropScenario();
    const drops: Drop[] = [
      fullDrop("own", 3, "viewer"),
      {
        id: "light",
        serial_no: 2,
        type: DropSize.LIGHT,
        waveId: "wave-1",
        stableKey: "light",
        stableHash: "light",
        author: "viewer",
      },
      fullDrop("old", 1, "other"),
    ];
    rerender({ drops, pinned: false, viewerProfileId: "viewer" });
    expect(renderedIds(result.current)).toEqual(["own", "old"]);
    expect(result.current.pendingDropsCount).toBe(1);
    rerender({ drops, pinned: false, viewerProfileId: null });
    expect(renderedIds(result.current)).toEqual(["old"]);
    expect(result.current.pendingDropsCount).toBe(2);
    rerender({ drops, pinned: false, viewerProfileId: "other" });
    expect(renderedIds(result.current)).toEqual(["old"]);
    expect(result.current.pendingDropsCount).toBe(2);
  });
});

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
