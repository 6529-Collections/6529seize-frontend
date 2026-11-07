import { act, render } from "@testing-library/react";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import {
  createWaveUnreadStore,
  type WaveUnreadEntry,
} from "@/contexts/wave/hooks/waveUnreadStore";
import {
  useWaveUnread,
  useWavesWithUnread,
  WaveUnreadProvider,
  type WaveUnreadSource,
} from "@/contexts/wave/WaveUnreadContext";

const baseWave = (id: string, unreadDropsCount = 0): MinimalWave =>
  ({
    id,
    name: id,
    unreadDropsCount,
    newDropsCount: {
      count: 0,
      latestDropTimestamp: 100,
      firstUnreadSerialNo: null,
    },
  }) as MinimalWave;

// Applies the live count the way the list core does, with a stable result per
// (wave, entry) pair.
const createSource = (): WaveUnreadSource => {
  const store = createWaveUnreadStore();
  const cache = new WeakMap<
    MinimalWave,
    { readonly unread: WaveUnreadEntry; readonly wave: MinimalWave }
  >();
  return {
    store,
    resolve: (wave, unread) => {
      if (!unread) return wave;
      const cached = cache.get(wave);
      if (cached?.unread === unread) return cached.wave;
      const resolved = {
        ...wave,
        unreadDropsCount: wave.unreadDropsCount + (unread.newDrops?.count ?? 0),
      };
      cache.set(wave, { unread, wave: resolved });
      return resolved;
    },
  };
};

const counts = (count: number) => ({
  count,
  latestDropTimestamp: 200,
  firstUnreadSerialNo: 5,
});

describe("WaveUnreadContext", () => {
  it("returns the waves unchanged without a provider or entries", () => {
    const waves = [baseWave("one"), baseWave("two")];
    let seen: readonly MinimalWave[] | null = null;
    const Probe = () => {
      seen = useWavesWithUnread(waves);
      return null;
    };
    render(<Probe />);
    expect(seen).toBe(waves);

    render(
      <WaveUnreadProvider value={createSource()}>
        <Probe />
      </WaveUnreadProvider>
    );
    expect(seen).toBe(waves);
  });

  it("gives only the receiving wave a new object", () => {
    const source = createSource();
    const waves = [baseWave("one", 1), baseWave("two")];
    let seen: readonly MinimalWave[] = [];
    const Probe = () => {
      seen = useWavesWithUnread(waves);
      return null;
    };
    render(
      <WaveUnreadProvider value={source}>
        <Probe />
      </WaveUnreadProvider>
    );

    act(() => {
      source.store.updateNewDropsCounts((previous) => ({
        ...previous,
        one: counts(2),
      }));
    });

    expect(seen[0]).not.toBe(waves[0]);
    expect(seen[0]?.unreadDropsCount).toBe(3);
    expect(seen[1]).toBe(waves[1]);
  });

  it("re-renders a single-wave reader only for its own wave", () => {
    const source = createSource();
    const wave = baseWave("one");
    const renders = jest.fn();
    let seen: MinimalWave | undefined;
    const Reader = () => {
      renders();
      seen = useWaveUnread(wave);
      return null;
    };
    render(
      <WaveUnreadProvider value={source}>
        <Reader />
      </WaveUnreadProvider>
    );
    expect(renders).toHaveBeenCalledTimes(1);
    expect(seen).toBe(wave);

    act(() => {
      source.store.updateNewDropsCounts(() => ({ two: counts(1) }));
    });
    expect(renders).toHaveBeenCalledTimes(1);

    act(() => {
      source.store.updateNewDropsCounts((previous) => ({
        ...previous,
        one: counts(4),
      }));
    });
    expect(renders).toHaveBeenCalledTimes(2);
    expect(seen?.unreadDropsCount).toBe(4);
  });
});
