import { createWaveUnreadStore } from "@/contexts/wave/hooks/waveUnreadStore";

const counts = (count: number, latestDropTimestamp = 100) => ({
  count,
  latestDropTimestamp,
  firstUnreadSerialNo: count > 0 ? 7 : null,
});

describe("waveUnreadStore", () => {
  it("notifies only the changed wave's listeners and keeps other entries", () => {
    const store = createWaveUnreadStore();
    const waveOne = jest.fn();
    const waveTwo = jest.fn();
    const all = jest.fn();
    store.subscribe("one", waveOne);
    store.subscribe("two", waveTwo);
    store.subscribeAll(all);

    store.updateNewDropsCounts((previous) => ({
      ...previous,
      one: counts(1),
    }));
    const firstSnapshot = store.getSnapshot();
    const oneEntry = store.get("one");
    expect(oneEntry).toEqual({
      newDrops: counts(1),
      cleared: false,
      forcedCount: undefined,
    });
    expect(waveOne).toHaveBeenCalledTimes(1);
    expect(waveTwo).not.toHaveBeenCalled();
    expect(all).toHaveBeenCalledTimes(1);

    store.updateNewDropsCounts((previous) => ({
      ...previous,
      two: counts(2),
    }));
    expect(store.getSnapshot()).not.toBe(firstSnapshot);
    // An untouched wave keeps its entry object.
    expect(store.get("one")).toBe(oneEntry);
    expect(waveOne).toHaveBeenCalledTimes(1);
    expect(waveTwo).toHaveBeenCalledTimes(1);
    expect(all).toHaveBeenCalledTimes(2);
  });

  it("ignores updates that change nothing", () => {
    const store = createWaveUnreadStore();
    const all = jest.fn();
    store.subscribeAll(all);
    const snapshot = store.getSnapshot();

    store.updateNewDropsCounts((previous) => previous);
    store.setCleared("one", false);
    store.setForcedCount("one", undefined);

    expect(all).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(snapshot);
  });

  it("clears every live count and keeps local overrides", () => {
    const store = createWaveUnreadStore();
    store.updateNewDropsCounts(() => ({ one: counts(1), two: counts(2) }));
    store.setForcedCount("two", 3);
    const one = jest.fn();
    store.subscribe("one", one);

    store.clearNewDropsCounts();

    expect(store.getNewDropsCounts()).toEqual({});
    expect(store.get("one")).toBeUndefined();
    expect(store.get("two")).toEqual({
      newDrops: undefined,
      cleared: false,
      forcedCount: 3,
    });
    expect(one).toHaveBeenCalledTimes(1);
  });

  it("tracks local read and mark-unread overrides with the live counts", () => {
    const store = createWaveUnreadStore();
    const listener = jest.fn();
    store.subscribe("one", listener);

    store.setCleared("one", true);
    expect(store.get("one")).toEqual({
      newDrops: undefined,
      cleared: true,
      forcedCount: undefined,
    });
    store.setForcedCount("one", 4);
    expect(store.get("one")?.forcedCount).toBe(4);
    store.setCleared("one", false);
    store.setForcedCount("one", undefined);
    expect(store.get("one")).toBeUndefined();
    expect(store.getSnapshot().size).toBe(0);
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("drops an entry when its counts are reset away", () => {
    const store = createWaveUnreadStore();
    store.updateNewDropsCounts(() => ({ one: counts(1), two: counts(1) }));
    store.updateNewDropsCounts(() => ({ two: counts(1) }));
    expect(store.get("one")).toBeUndefined();
    expect(store.getNewDropsCounts()).toEqual({ two: counts(1) });
  });

  it("stops notifying after unsubscribe", () => {
    const store = createWaveUnreadStore();
    const listener = jest.fn();
    const all = jest.fn();
    const unsubscribe = store.subscribe("one", listener);
    const unsubscribeAll = store.subscribeAll(all);
    unsubscribe();
    unsubscribeAll();
    store.setCleared("one", true);
    expect(listener).not.toHaveBeenCalled();
    expect(all).not.toHaveBeenCalled();
  });
});
