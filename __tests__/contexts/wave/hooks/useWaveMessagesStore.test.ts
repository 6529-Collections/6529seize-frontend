import { renderHook, act, waitFor } from "@testing-library/react";
import useWaveMessagesStore from "@/contexts/wave/hooks/useWaveMessagesStore";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

describe("useWaveMessagesStore", () => {
  const baseDrop = {
    id: "d1",
    serial_no: 1,
    wave: { id: "wave1" },
    author: { handle: "a" },
    parts: [],
    metadata: [],
    created_at: "2020",
    title: "",
    type: "FULL",
  } as any;

  it("allows subscription and updates data", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();

    act(() => result.current.subscribe("wave1", listener));
    expect(listener).toHaveBeenCalledWith(undefined);

    act(() => {
      result.current.updateData({ key: "wave1", drops: [baseDrop] } as any);
    });

    const data = result.current.getData("wave1");
    expect(data?.drops[0]?.id).toBe("d1");
    await waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: "wave1" })
      )
    );
  });

  it("removes drops and exposes updated state", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();

    act(() => result.current.subscribe("wave1", listener));
    act(() => {
      result.current.updateData({ key: "wave1", drops: [baseDrop] } as any);
    });
    await waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: "wave1" })
      )
    );
    listener.mockClear();

    act(() => result.current.removeDrop("wave1", "d1"));
    expect(result.current.getData("wave1")?.drops).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ drops: [] })
    );

    const lateListener = jest.fn();
    act(() => result.current.subscribe("wave1", lateListener));
    expect(lateListener).toHaveBeenCalledWith(
      expect.objectContaining({ drops: [] })
    );
  });

  it("keeps subscription functions stable and sends current data to late subscribers", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const initialSubscribe = result.current.subscribe;
    const initialUnsubscribe = result.current.unsubscribe;
    const initialRemoveDrop = result.current.removeDrop;
    const initialOptimisticUpdateDrop = result.current.optimisticUpdateDrop;
    const listener = jest.fn();

    act(() => {
      result.current.updateData({ key: "wave1", drops: [baseDrop] } as any);
    });

    await waitFor(() =>
      expect(result.current.getData("wave1")?.drops[0]?.id).toBe("d1")
    );
    expect(result.current.subscribe).toBe(initialSubscribe);
    expect(result.current.unsubscribe).toBe(initialUnsubscribe);
    expect(result.current.removeDrop).toBe(initialRemoveDrop);
    expect(result.current.optimisticUpdateDrop).toBe(
      initialOptimisticUpdateDrop
    );

    act(() => result.current.subscribe("wave1", listener));

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        drops: expect.arrayContaining([expect.objectContaining({ id: "d1" })]),
      })
    );

    const newerDrop = {
      ...baseDrop,
      id: "d2",
      serial_no: 2,
      created_at: "2021",
    };

    act(() => {
      result.current.updateData({ key: "wave1", drops: [newerDrop] } as any);
    });

    await waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          drops: expect.arrayContaining([
            expect.objectContaining({ id: "d2" }),
          ]),
        })
      )
    );
  });

  it("tracks only the matching pending server seed promise", () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const firstPromise = Promise.resolve({ ok: false, waveId: "wave1" } as const);
    const replacementPromise = Promise.resolve({
      ok: false,
      waveId: "wave1",
    } as const);

    act(() => {
      result.current.registerPendingServerFeedSeed("wave1", firstPromise);
      result.current.registerPendingServerFeedSeed("wave1", replacementPromise);
      result.current.clearPendingServerFeedSeed("wave1", firstPromise);
    });

    expect(result.current.hasServerFeedSeed("wave1")).toBe(true);

    act(() => {
      result.current.clearPendingServerFeedSeed("wave1", replacementPromise);
    });

    expect(result.current.hasServerFeedSeed("wave1")).toBe(false);
  });

  it("rejects a late old-profile promise after the gate is invalidated", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const expectedPromise = new Promise<any>(() => {});
    const oldProfilePromise = new Promise<any>(() => {});

    act(() => {
      result.current.registerPendingServerFeedSeed("wave1", expectedPromise);
    });
    await act(async () => {
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
      await Promise.resolve();
    });

    let didReplace = true;
    act(() => {
      didReplace = result.current.replacePendingServerFeedSeed(
        "wave1",
        expectedPromise,
        oldProfilePromise
      );
    });

    expect(didReplace).toBe(false);
    expect(result.current.hasServerFeedSeed("wave1")).toBe(false);
  });

  it("merges a server seed without truncating cache or overwriting newer state", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();
    const optimisticDrop = {
      ...baseDrop,
      title: "optimistic title",
      optimisticMarker: true,
    };
    const cachedOlderDrop = {
      ...baseDrop,
      id: "cached-older",
      serial_no: 0,
      created_at: "2019",
    };
    const serverCopy = {
      ...baseDrop,
      title: "older server title",
    };
    const serverNewDrop = {
      ...baseDrop,
      id: "server-new",
      serial_no: 2,
      created_at: "2022",
    };
    const seedPromise = Promise.resolve({ ok: false, waveId: "wave1" } as const);

    act(() => result.current.subscribe("wave1", listener));
    act(() => {
      result.current.updateData({
        key: "wave1",
        drops: [optimisticDrop, cachedOlderDrop],
        hasNextPage: false,
        isLoading: true,
        isLoadingNextPage: true,
        latestFetchedSerialNo: 9,
      } as any);
    });
    await waitFor(() =>
      expect(result.current.getData("wave1")?.drops).toHaveLength(2)
    );
    listener.mockClear();

    act(() => {
      result.current.registerPendingServerFeedSeed("wave1", seedPromise);
      result.current.applyServerFeedSeed({
        waveId: "wave1",
        drops: [serverCopy, serverNewDrop] as any,
        hasNextPage: true,
        promise: seedPromise,
      });
    });

    await waitFor(() =>
      expect(result.current.getData("wave1")?.drops).toHaveLength(3)
    );
    const merged = result.current.getData("wave1");
    expect(merged).toEqual(
      expect.objectContaining({
        hasNextPage: false,
        isLoading: true,
        isLoadingNextPage: true,
        latestFetchedSerialNo: 9,
      })
    );
    expect(merged?.drops.find((drop) => drop.id === "d1")).toEqual(
      expect.objectContaining({
        optimisticMarker: true,
        title: "optimistic title",
      })
    );
    expect(merged?.drops.map((drop) => drop.id)).toEqual(
      expect.arrayContaining(["d1", "cached-older", "server-new"])
    );
    expect(listener).toHaveBeenCalledTimes(1);
    expect(result.current.hasServerFeedSeed("wave1")).toBe(true);

    act(() =>
      result.current.completeInitialServerFeedRegistration("wave1")
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.hasServerFeedSeed("wave1")).toBe(false);
  });

  it("does not reactivate the guard when the seed resolves after initial registration", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const seedPromise = Promise.resolve({
      ok: true,
      waveId: "wave1",
      drops: [],
      hasNextPage: false,
    } as const);

    act(() => {
      result.current.registerPendingServerFeedSeed("wave1", seedPromise);
      result.current.completeInitialServerFeedRegistration("wave1");
    });
    await act(async () => {
      await Promise.resolve();
    });

    let didApply = false;
    act(() => {
      didApply = result.current.applyServerFeedSeed({
        waveId: "wave1",
        drops: [baseDrop] as any,
        hasNextPage: false,
        promise: seedPromise,
      });
    });

    expect(didApply).toBe(true);
    expect(result.current.hasServerFeedSeed("wave1")).toBe(false);
    expect(result.current.getData("wave1")?.drops).toHaveLength(1);
  });

  it.each(["seed-first", "incoming-first"])(
    "keeps an incoming update when it races with a %s server seed",
    async (order) => {
      const { result } = renderHook(() => useWaveMessagesStore());
      const seedDrop = { ...baseDrop, title: "server title" };
      const incomingDrop = {
        ...baseDrop,
        title: "live title",
        liveMarker: true,
      };
      const seedPromise = Promise.resolve({
        ok: false,
        waveId: "wave1",
      } as const);

      act(() => {
        result.current.registerPendingServerFeedSeed("wave1", seedPromise);
        if (order === "seed-first") {
          result.current.applyServerFeedSeed({
            waveId: "wave1",
            drops: [seedDrop] as any,
            hasNextPage: true,
            promise: seedPromise,
          });
          result.current.updateData({
            key: "wave1",
            drops: [incomingDrop],
          } as any);
        } else {
          result.current.updateData({
            key: "wave1",
            drops: [incomingDrop],
          } as any);
          result.current.applyServerFeedSeed({
            waveId: "wave1",
            drops: [seedDrop] as any,
            hasNextPage: true,
            promise: seedPromise,
          });
        }
      });

      await waitFor(() =>
        expect(result.current.getData("wave1")?.drops[0]).toEqual(
          expect.objectContaining({
            liveMarker: true,
            title: "live title",
          })
        )
      );
    }
  );

  it("keeps seed listener notifications behind already queued live updates", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();
    const liveDrop = { ...baseDrop, title: "live" };
    const seedDrop = {
      ...baseDrop,
      id: "seed-only",
      serial_no: 2,
      created_at: "2022",
    };
    const seedPromise = Promise.resolve({
      ok: false,
      waveId: "wave1",
    } as const);

    act(() => result.current.subscribe("wave1", listener));
    listener.mockClear();
    let didApply = false;
    act(() => {
      result.current.registerPendingServerFeedSeed("wave1", seedPromise);
      result.current.updateData({ key: "wave1", drops: [liveDrop] } as any);
      didApply = result.current.applyServerFeedSeed({
        waveId: "wave1",
        drops: [seedDrop] as any,
        hasNextPage: true,
        promise: seedPromise,
      });
    });
    expect(didApply).toBe(true);

    await waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          drops: expect.arrayContaining([
            expect.objectContaining({ id: "d1" }),
            expect.objectContaining({ id: "seed-only" }),
          ]),
        })
      )
    );
    if (listener.mock.calls.length > 1) {
      expect(
        listener.mock.calls[0]?.[0].drops.map((drop: any) => drop.id)
      ).toEqual(["d1"]);
    }
  });

  it("discards an old-profile seed after a profile switch without notifying", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();
    const oldProfilePromise = Promise.resolve({
      ok: true,
      waveId: "wave1",
      drops: [],
      hasNextPage: false,
    } as const);

    act(() => {
      result.current.subscribe("wave1", listener);
      result.current.registerPendingServerFeedSeed(
        "wave1",
        oldProfilePromise
      );
    });
    listener.mockClear();

    await act(async () => {
      await Promise.resolve();
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
    });

    let didApply = true;
    act(() => {
      didApply = result.current.applyServerFeedSeed({
        waveId: "wave1",
        drops: [baseDrop] as any,
        hasNextPage: true,
        promise: oldProfilePromise,
      });
    });

    expect(didApply).toBe(false);
    expect(result.current.getData("wave1")).toBeUndefined();
    expect(result.current.hasServerFeedSeed("wave1")).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("clears already seeded data on profile switch before a current-auth refresh", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();
    const seedPromise = Promise.resolve({
      ok: true,
      waveId: "wave1",
      drops: [],
      hasNextPage: false,
    } as const);

    act(() => {
      result.current.subscribe("wave1", listener);
      result.current.registerPendingServerFeedSeed("wave1", seedPromise);
      result.current.applyServerFeedSeed({
        waveId: "wave1",
        drops: [baseDrop] as any,
        hasNextPage: false,
        promise: seedPromise,
      });
    });
    await waitFor(() =>
      expect(result.current.getData("wave1")?.drops).toHaveLength(1)
    );
    listener.mockClear();

    await act(async () => {
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
      await Promise.resolve();
    });

    expect(result.current.getData("wave1")).toBeUndefined();
    expect(result.current.hasServerFeedSeed("wave1")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(undefined);
  });
});
