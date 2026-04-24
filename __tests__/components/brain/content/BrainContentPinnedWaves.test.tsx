import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { PinnedWaveSnapshot } from "@/hooks/usePinnedWaves";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const upsertWave = jest.fn();
const upsertWaveSnapshot = jest.fn();
const removeId = jest.fn();
const commonApiFetch = jest.fn();

jest.mock("@/hooks/usePinnedWaves", () => ({
  isPinnedWaveSnapshotStale: (snapshot: PinnedWaveSnapshot) =>
    snapshot.fetchedAt <= 0,
  usePinnedWaves: () => ({
    pinnedIds: mockPinnedWaves.map((wave) => wave.id),
    pinnedWaves: mockPinnedWaves,
    upsertWave,
    upsertWaveSnapshot,
    removeId,
  }),
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: mockCurrentWave }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetch(...args),
}));

const baseWave = (
  overrides: Partial<PinnedWaveSnapshot> = {}
): PinnedWaveSnapshot => ({
  id: "wave-1",
  name: "Wave 1",
  picture: null,
  contributors: [],
  isDirectMessage: false,
  type: ApiWaveType.Chat,
  fetchedAt: Date.now(),
  ...overrides,
});

const baseApiWave = (overrides: Partial<ApiWave> = {}): ApiWave =>
  ({
    id: "wave-1",
    name: "Wave 1",
    picture: null,
    contributors_overview: [],
    chat: { scope: { group: null } },
    wave: { type: ApiWaveType.Chat },
    ...overrides,
  }) as ApiWave;

let mockPinnedWaves: PinnedWaveSnapshot[] = [];
let mockCurrentWave: ApiWave | undefined;

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const scrollerProps = jest.fn();

jest.mock(
  "@/components/brain/content/pinned-waves/subcomponents/PinnedWavesScroller",
  () => ({
    __esModule: true,
    default: (props: any) => {
      scrollerProps(props);

      return (
        <div>
          {props.pinnedWaves.map((wave: PinnedWaveSnapshot) => (
            <button
              key={wave.id}
              type="button"
              data-testid={`remove-${wave.id}`}
              onClick={() => props.onRemove(wave.id)}
            >
              remove {wave.id}
            </button>
          ))}
        </div>
      );
    },
  })
);

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

import BrainContentPinnedWaves from "@/components/brain/content/BrainContentPinnedWaves";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

const mockUseMyStream = useMyStream as jest.Mock;

beforeAll(() => {
  (window as any).matchMedia =
    (window as any).matchMedia ||
    (() => ({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

describe("BrainContentPinnedWaves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    removeId.mockClear();
    replace.mockClear();
    mockPinnedWaves = [];
    mockCurrentWave = undefined;
    commonApiFetch.mockResolvedValue({
      id: "stale-wave",
      name: "Stale Wave",
    });
    mockUseMyStream.mockReturnValue({
      activeWave: { id: null },
      directMessages: { list: [] },
    });
  });

  it("returns null when no pinned waves", () => {
    const { container } = render(<BrainContentPinnedWaves />);
    expect(container.firstChild).toBeNull();
  });

  it("moves the current wave to the front when full data is available", async () => {
    mockCurrentWave = baseApiWave();
    mockUseMyStream.mockReturnValue({
      activeWave: { id: "wave-1" },
      directMessages: { list: [] },
    });

    render(<BrainContentPinnedWaves />);

    await waitFor(() =>
      expect(upsertWave).toHaveBeenCalledWith(mockCurrentWave, {
        moveToFront: true,
      })
    );
  });

  it("inserts a fallback snapshot when the current wave is missing", async () => {
    mockUseMyStream.mockReturnValue({
      activeWave: { id: "wave-1" },
      directMessages: { list: [] },
    });

    render(<BrainContentPinnedWaves />);

    await waitFor(() =>
      expect(upsertWaveSnapshot).toHaveBeenCalledWith(
        {
          id: "wave-1",
          name: null,
          picture: null,
          contributors: [],
          isDirectMessage: false,
          type: null,
          fetchedAt: 0,
        },
        { moveToFront: true }
      )
    );
  });

  it("refreshes stale non-active snapshots once", async () => {
    const refreshedWave = { id: "stale-wave", name: "Fresh Wave" } as ApiWave;
    mockPinnedWaves = [
      baseWave({
        id: "stale-wave",
        fetchedAt: 0,
      }),
    ];
    commonApiFetch.mockResolvedValue(refreshedWave);

    render(<BrainContentPinnedWaves />);

    await waitFor(() =>
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint: "waves/stale-wave",
      })
    );
    await waitFor(() =>
      expect(upsertWave).toHaveBeenCalledWith(refreshedWave, {
        moveToFront: false,
      })
    );
    expect(commonApiFetch).toHaveBeenCalledTimes(1);
  });

  it("does not resync the current wave when only pinned waves change", async () => {
    mockCurrentWave = baseApiWave();
    mockUseMyStream.mockReturnValue({
      activeWave: { id: "wave-1" },
      directMessages: { list: [] },
    });

    const { rerender } = render(<BrainContentPinnedWaves />);

    await waitFor(() => expect(upsertWave).toHaveBeenCalledTimes(1));

    mockPinnedWaves = [baseWave({ id: "wave-1" })];
    rerender(<BrainContentPinnedWaves />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(upsertWave).toHaveBeenCalledTimes(1);
  });

  it("does not resync the current wave when the current wave object is recreated", async () => {
    mockCurrentWave = baseApiWave();
    mockPinnedWaves = [baseWave({ id: "wave-1" })];
    mockUseMyStream.mockReturnValue({
      activeWave: { id: "wave-1" },
      directMessages: { list: [] },
    });

    const { rerender } = render(<BrainContentPinnedWaves />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(upsertWave).not.toHaveBeenCalled();

    mockCurrentWave = baseApiWave();
    rerender(<BrainContentPinnedWaves />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(upsertWave).not.toHaveBeenCalled();
  });

  it("removes stale pinned waves when refresh returns not found", async () => {
    mockPinnedWaves = [
      baseWave({
        id: "stale-wave",
        fetchedAt: 0,
      }),
    ];
    commonApiFetch.mockRejectedValue("Wave stale-wave not found");

    render(<BrainContentPinnedWaves />);

    await waitFor(() => expect(removeId).toHaveBeenCalledWith("stale-wave"));
    expect(upsertWave).not.toHaveBeenCalled();
  });

  it("removes stale pinned waves when refresh returns a 404 status", async () => {
    mockPinnedWaves = [
      baseWave({
        id: "stale-wave",
        fetchedAt: 0,
      }),
    ];
    commonApiFetch.mockRejectedValue({ response: { status: 404 } });

    render(<BrainContentPinnedWaves />);

    await waitFor(() => expect(removeId).toHaveBeenCalledWith("stale-wave"));
    expect(upsertWave).not.toHaveBeenCalled();
  });

  it("keeps stale pinned waves when refresh fails with a network error", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockPinnedWaves = [
      baseWave({
        id: "stale-wave",
        fetchedAt: 0,
      }),
    ];
    commonApiFetch.mockRejectedValue(new Error("Network request failed"));

    render(<BrainContentPinnedWaves />);

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(removeId).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("removes the active wave and routes back to the waves home", async () => {
    mockPinnedWaves = [baseWave()];
    mockUseMyStream.mockReturnValue({
      activeWave: { id: "wave-1" },
      directMessages: { list: [] },
    });

    const user = userEvent.setup();
    render(<BrainContentPinnedWaves />);

    await user.click(screen.getByTestId("remove-wave-1"));

    expect(removeId).toHaveBeenCalledWith("wave-1");
    expect(replace).toHaveBeenCalledWith("/waves");
  });

  it("removes the active direct message wave and routes back to messages", async () => {
    mockPinnedWaves = [baseWave({ isDirectMessage: true })];
    mockUseMyStream.mockReturnValue({
      activeWave: { id: "wave-1" },
      directMessages: { list: [{ id: "wave-1" }] },
    });

    const user = userEvent.setup();
    render(<BrainContentPinnedWaves />);

    await user.click(screen.getByTestId("remove-wave-1"));

    expect(removeId).toHaveBeenCalledWith("wave-1");
    expect(replace).toHaveBeenCalledWith("/messages");
  });
});
