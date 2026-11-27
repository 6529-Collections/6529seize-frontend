import { renderHook } from "@testing-library/react";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useWavesMoveDropGuard } from "@/components/waves/useWavesMoveDropGuard";
import { WavesWritePausedError } from "@/lib/waves-move/writeGuard";
import { removeTemporaryThreadReply } from "@/components/waves/drops/reply-threads/pending-replies";

let mockPaused = false;
// Set for the state after the switch-on, where kinds differ.
let mockPausedFor: ((kind?: string) => boolean) | null = null;
const mockSetToast = jest.fn();
const mockQueryClient = {};

let mockMovedToChain = false;
jest.mock("@/hooks/useWavesMovePhase", () => ({
  useWavesWritesPaused: (kind?: string) =>
    mockPausedFor ? mockPausedFor(kind) : mockPaused,
  useWaveMovedToChain: () => mockMovedToChain,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: mockSetToast }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));
jest.mock("@/components/waves/drops/reply-threads/pending-replies", () => ({
  removeTemporaryThreadReply: jest.fn(),
}));

const send = (dropType: ApiDropType, extra: Record<string, unknown> = {}) => ({
  dropId: "temp-1",
  drop: { wave_id: "wave-1", drop_type: dropType, ...extra } as never,
  onError: jest.fn(),
});

describe("useWavesMoveDropGuard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockPaused = false;
    mockPausedFor = null;
    mockMovedToChain = false;
  });
  afterEach(() => jest.useRealTimers());

  it("lets everything through while nothing is paused", () => {
    const removed = jest.fn();
    const { result } = renderHook(() => useWavesMoveDropGuard(removed));
    const entry = send(ApiDropType.Participatory);
    expect(result.current.entriesPausedForMove).toBe(false);
    expect(result.current.refuseDropMode()).toBe(false);
    expect(result.current.refusePausedDrop(entry)).toBe(false);
    jest.runAllTimers();
    expect(removed).not.toHaveBeenCalled();
    expect(entry.onError).not.toHaveBeenCalled();
    expect(mockSetToast).not.toHaveBeenCalled();
  });

  it("keeps chat working while entries are paused", () => {
    mockPaused = true;
    const { result } = renderHook(() => useWavesMoveDropGuard(jest.fn()));
    expect(result.current.refusePausedDrop(send(ApiDropType.Chat))).toBe(false);
    expect(mockSetToast).not.toHaveBeenCalled();
  });

  it("refuses an entry or a poll and takes back what a sender showed", () => {
    mockPaused = true;
    const removed = jest.fn();
    const { result } = renderHook(() => useWavesMoveDropGuard(removed));
    const entry = send(ApiDropType.Participatory, {
      reply_to: { drop_id: "parent" },
    });
    const poll = send(ApiDropType.Chat, { poll: { options: [] } });

    expect(result.current.refusePausedDrop(entry)).toBe(true);
    expect(result.current.refusePausedDrop(poll)).toBe(true);
    jest.runAllTimers();

    expect(removed).toHaveBeenCalledWith("wave-1", "temp-1");
    expect(removeTemporaryThreadReply).toHaveBeenCalledTimes(1);
    expect(removeTemporaryThreadReply).toHaveBeenCalledWith(
      mockQueryClient,
      "wave-1",
      "temp-1"
    );
    expect(entry.onError).toHaveBeenCalledWith(
      expect.any(WavesWritePausedError)
    );
    expect(mockSetToast).toHaveBeenCalledWith({
      message: "Paused for the move to the 6529 Network.",
      type: "error",
    });
  });

  it("lets an entry through after the switch-on while new polls stay paused", () => {
    mockPausedFor = (kind) => kind === undefined;
    const removed = jest.fn();
    const { result } = renderHook(() => useWavesMoveDropGuard(removed));
    const entry = send(ApiDropType.Participatory);
    const poll = send(ApiDropType.Chat, { poll: { options: [] } });

    expect(result.current.entriesPausedForMove).toBe(false);
    expect(result.current.refuseDropMode()).toBe(false);
    expect(result.current.refusePausedDrop(entry)).toBe(false);
    expect(mockSetToast).not.toHaveBeenCalled();
    expect(result.current.refusePausedDrop(poll)).toBe(true);
    jest.runAllTimers();

    expect(entry.onError).not.toHaveBeenCalled();
    expect(removed).toHaveBeenCalledTimes(1);
    expect(mockSetToast).toHaveBeenCalledTimes(1);
  });

  it("says new polls aren't open yet for a poll in a wave that moved", () => {
    mockPausedFor = (kind) => kind === undefined;
    mockMovedToChain = true;
    const { result } = renderHook(() => useWavesMoveDropGuard(jest.fn()));
    const poll = send(ApiDropType.Chat, { poll: { options: [] } });

    expect(result.current.refusePausedDrop(poll)).toBe(true);
    expect(mockSetToast).toHaveBeenCalledWith({
      message: "New polls aren't open yet.",
      type: "error",
    });
  });

  it("keeps the paused line for an entry refused in a wave that moved", () => {
    mockPaused = true;
    mockMovedToChain = true;
    const { result } = renderHook(() => useWavesMoveDropGuard(jest.fn()));

    expect(
      result.current.refusePausedDrop(
        send(ApiDropType.Participatory, { poll: { options: [] } })
      )
    ).toBe(true);
    expect(mockSetToast).toHaveBeenCalledWith({
      message: "Paused for the move to the 6529 Network.",
      type: "error",
    });
  });

  it("refuses drop mode with the paused line", () => {
    mockPaused = true;
    const { result } = renderHook(() => useWavesMoveDropGuard(jest.fn()));
    expect(result.current.refuseDropMode()).toBe(true);
    expect(mockSetToast).toHaveBeenCalledTimes(1);
  });
});
