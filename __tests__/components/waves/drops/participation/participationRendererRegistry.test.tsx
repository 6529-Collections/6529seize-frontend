import { renderHook } from "@testing-library/react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { DefaultSingleWaveDrop } from "@/components/waves/drop/DefaultSingleWaveDrop";
import DefaultParticipationDrop from "@/components/waves/drops/participation/DefaultParticipationDrop";
import { useWaveParticipationRendererSet } from "@/components/waves/drops/participation/participationRendererRegistry";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

jest.mock(
  "@/components/waves/drops/participation/DefaultParticipationDrop",
  () => ({
    __esModule: true,
    default: jest.fn(),
  })
);

jest.mock("@/components/waves/drop/DefaultSingleWaveDrop", () => ({
  __esModule: true,
  DefaultSingleWaveDrop: jest.fn(),
}));

jest.mock("@/components/memes/drops/MemeParticipationDrop", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/waves/drop/MemesSingleWaveDrop", () => ({
  __esModule: true,
  MemesSingleWaveDrop: jest.fn(),
}));

jest.mock("@/components/waves/quorum/QuorumParticipationDrop", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/waves/drop/QuorumSingleWaveDrop", () => ({
  __esModule: true,
  QuorumSingleWaveDrop: jest.fn(),
}));

const mockUseSeizeSettings = useSeizeSettings as jest.Mock;

describe("useWaveParticipationRendererSet", () => {
  beforeEach(() => {
    mockUseSeizeSettings.mockReturnValue({
      isMemesWave: () => false,
      isCurationWave: () => false,
      isQuorumWave: () => false,
    });
  });

  it("returns the explicit curation variant with default renderers", () => {
    mockUseSeizeSettings.mockReturnValue({
      isMemesWave: () => false,
      isCurationWave: (waveId: string) => waveId === "curation-wave",
      isQuorumWave: () => false,
    });

    const { result } = renderHook(() =>
      useWaveParticipationRendererSet("curation-wave")
    );

    expect(result.current.variant).toBe("curation");
    expect(result.current.ParticipationDrop).toBe(DefaultParticipationDrop);
    expect(result.current.SingleWaveDrop).toBe(DefaultSingleWaveDrop);
  });
});
