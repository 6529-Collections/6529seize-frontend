import { renderHook } from "@testing-library/react";
import { DefaultSingleWaveDrop } from "@/components/waves/drop/DefaultSingleWaveDrop";
import { MemesSingleWaveDrop } from "@/components/waves/drop/MemesSingleWaveDrop";
import { QuorumSingleWaveDrop } from "@/components/waves/drop/QuorumSingleWaveDrop";
import { useWaveSingleWaveDropRendererSet } from "@/components/waves/drop/singleWaveDropRendererRegistry";
import { useWaveParticipationVariant } from "@/hooks/waves/useWaveParticipationVariant";
import type { WaveParticipationVariant } from "@/helpers/waves/wave-participation-presentation.helpers";
import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";

jest.mock("@/hooks/waves/useWaveParticipationVariant", () => ({
  useWaveParticipationVariant: jest.fn(),
}));

jest.mock("@/components/waves/drop/DefaultSingleWaveDrop", () => ({
  __esModule: true,
  DefaultSingleWaveDrop: jest.fn(),
}));

jest.mock("@/components/waves/drop/MemesSingleWaveDrop", () => ({
  __esModule: true,
  MemesSingleWaveDrop: jest.fn(),
}));

jest.mock("@/components/waves/drop/QuorumSingleWaveDrop", () => ({
  __esModule: true,
  QuorumSingleWaveDrop: jest.fn(),
}));

const mockUseWaveParticipationVariant =
  useWaveParticipationVariant as jest.MockedFunction<
    typeof useWaveParticipationVariant
  >;

describe("useWaveSingleWaveDropRendererSet", () => {
  it.each([
    ["default", DefaultSingleWaveDrop],
    ["curation", DefaultSingleWaveDrop],
    ["memes", MemesSingleWaveDrop],
    ["quorum", QuorumSingleWaveDrop],
  ] as const satisfies ReadonlyArray<
    readonly [WaveParticipationVariant, unknown]
  >)(
    "renders the %s variant with its single drop view",
    (variant, renderer) => {
      mockUseWaveParticipationVariant.mockReturnValue(variant);

      const { result } = renderHook(() =>
        useWaveSingleWaveDropRendererSet("wave")
      );

      expect(mockUseWaveParticipationVariant).toHaveBeenCalledWith(
        "wave",
        undefined
      );
      expect(result.current.SingleWaveDrop).toBe(renderer);
    }
  );

  it.each([
    { capabilities: [] },
    { capabilities: [ApiCompetitionCapability.MainStage] },
  ])(
    "forwards explicit native capabilities $capabilities without inferring them from the parent",
    ({ capabilities }) => {
      renderHook(() => useWaveSingleWaveDropRendererSet("wave", capabilities));
      expect(mockUseWaveParticipationVariant).toHaveBeenLastCalledWith(
        "wave",
        capabilities
      );
    }
  );
});
