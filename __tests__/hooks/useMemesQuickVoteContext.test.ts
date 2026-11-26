import { renderHook } from "@testing-library/react";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useWavesWritesPaused } from "@/hooks/useWavesMovePhase";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { handle: "voter" },
    activeProfileProxy: null,
  }),
}));
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: { memes_wave_id: "memes-wave" },
    isLoaded: true,
  }),
}));
jest.mock("@/hooks/useWavesMovePhase", () => ({
  useWavesWritesPaused: jest.fn(() => false),
}));

const paused = useWavesWritesPaused as jest.Mock;

describe("useMemesQuickVoteContext", () => {
  afterEach(() => {
    paused.mockReturnValue(false);
  });

  it("is on for a signed-in profile with the memes wave set", () => {
    const { result } = renderHook(() => useMemesQuickVoteContext());
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.memesWaveId).toBe("memes-wave");
  });

  it("is off while votes move to the 6529 Network", () => {
    paused.mockReturnValue(true);
    const { result } = renderHook(() => useMemesQuickVoteContext());
    expect(result.current.isEnabled).toBe(false);
  });
});
