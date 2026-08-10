import { render, renderHook } from "@testing-library/react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { DefaultSingleWaveDrop } from "@/components/waves/drop/DefaultSingleWaveDrop";
import DefaultParticipationDrop from "@/components/waves/drops/participation/DefaultParticipationDrop";
import { useWaveParticipationRendererSet } from "@/components/waves/drops/participation/participationRendererRegistry";
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

jest.mock("@/hooks/waves/useWaveProposalCardPresentation", () => ({
  useWaveProposalCardPresentation: jest.fn(),
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
const mockUseWaveProposalCardPresentation =
  useWaveProposalCardPresentation as jest.Mock;

describe("useWaveParticipationRendererSet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSeizeSettings.mockReturnValue({
      isMemesWave: () => false,
      isCurationWave: () => false,
      isQuorumWave: () => false,
    });
    mockUseWaveProposalCardPresentation.mockReturnValue("default");
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

  it("uses compact cards in proposal lists while keeping the full detail renderer", () => {
    mockUseWaveProposalCardPresentation.mockReturnValue("proposalCard");

    const { result } = renderHook(() =>
      useWaveParticipationRendererSet("network-museum")
    );
    const ParticipationDrop = result.current.ParticipationDrop;

    render(<ParticipationDrop {...({ drop: {} } as any)} />);

    expect(DefaultParticipationDrop).toHaveBeenCalledWith(
      expect.objectContaining({ contentPresentation: "proposalCard" }),
      undefined
    );
    expect(result.current.SingleWaveDrop).toBe(DefaultSingleWaveDrop);
  });
});
