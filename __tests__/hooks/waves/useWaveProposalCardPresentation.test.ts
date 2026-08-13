import { renderHook } from "@testing-library/react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { INITIAL_COMPACT_PROPOSAL_CARD_WAVE_IDS } from "@/helpers/waves/wave-metadata.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveMetadata: jest.fn(),
}));

const mockUseSeizeSettings = useSeizeSettings as jest.Mock;
const mockUseWaveMetadata = useWaveMetadata as jest.Mock;
const INITIAL_PROPOSAL_CARD_WAVE_ID = [
  ...INITIAL_COMPACT_PROPOSAL_CARD_WAVE_IDS,
][0]!;

describe("useWaveProposalCardPresentation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSeizeSettings.mockReturnValue({
      isMemesWave: () => false,
      isCurationWave: () => false,
      isQuorumWave: () => false,
    });
    mockUseWaveMetadata.mockReturnValue({ data: [] });
  });

  it("enables the initial Network Museum rollout", () => {
    const { result } = renderHook(() =>
      useWaveProposalCardPresentation(INITIAL_PROPOSAL_CARD_WAVE_ID)
    );

    expect(result.current).toBe("proposalCard");
    expect(mockUseWaveMetadata).toHaveBeenCalledWith(
      INITIAL_PROPOSAL_CARD_WAVE_ID,
      { enabled: true }
    );
  });

  it("keeps other standard waves unchanged unless they explicitly opt in", () => {
    const { result, rerender } = renderHook(
      ({ waveId }) => useWaveProposalCardPresentation(waveId),
      { initialProps: { waveId: "standard-wave" } }
    );

    expect(result.current).toBe("default");

    mockUseWaveMetadata.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: "wave_display.proposals.card_recipe",
          data_value:
            '{"version":1,"layout":"summary","excerpt_max_characters":420,"show_media_thumbnail":false}',
        },
      ],
    });
    rerender({ waveId: "opted-in-wave" });

    expect(result.current).toBe("proposalCard");
  });

  it.each(["memes", "curation", "quorum"])(
    "preserves the specialized %s renderer",
    (specializedWave) => {
      mockUseSeizeSettings.mockReturnValue({
        isMemesWave: (waveId: string) =>
          specializedWave === "memes" && waveId === specializedWave,
        isCurationWave: (waveId: string) =>
          specializedWave === "curation" && waveId === specializedWave,
        isQuorumWave: (waveId: string) =>
          specializedWave === "quorum" && waveId === specializedWave,
      });
      mockUseWaveMetadata.mockReturnValue({
        data: [
          {
            id: 1,
            data_key: "wave_display.proposals.compact",
            data_value: "true",
          },
        ],
      });

      const { result } = renderHook(() =>
        useWaveProposalCardPresentation(specializedWave)
      );

      expect(result.current).toBe("default");
      expect(mockUseWaveMetadata).toHaveBeenCalledWith(specializedWave, {
        enabled: false,
      });
    }
  );
});
