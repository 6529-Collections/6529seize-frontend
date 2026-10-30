import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import { renderHook } from "@testing-library/react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useWaveParticipationVariant } from "@/hooks/waves/useWaveParticipationVariant";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

const mockUseSeizeSettings = useSeizeSettings as jest.MockedFunction<
  typeof useSeizeSettings
>;

const mockSettings = (waves: {
  readonly memes?: string;
  readonly curation?: string;
  readonly quorum?: string;
}) =>
  mockUseSeizeSettings.mockReturnValue({
    isMemesWave: (waveId: string | null | undefined) => waveId === waves.memes,
    isCurationWave: (waveId: string | null | undefined) =>
      waveId === waves.curation,
    isQuorumWave: (waveId: string | null | undefined) =>
      waveId === waves.quorum,
  } as ReturnType<typeof useSeizeSettings>);

describe("useWaveParticipationVariant", () => {
  it.each([
    ["memes-wave", "memes"],
    ["curation-wave", "curation"],
    ["quorum-wave", "quorum"],
    ["other-wave", "default"],
    [null, "default"],
  ] as const)("resolves wave %s to the %s variant", (waveId, variant) => {
    mockSettings({
      memes: "memes-wave",
      curation: "curation-wave",
      quorum: "quorum-wave",
    });

    const { result } = renderHook(() => useWaveParticipationVariant(waveId));

    expect(result.current).toBe(variant);
  });
});

it.each([
  [[], "default"],
  [[ApiCompetitionCapability.MainStage], "memes"],
  [[ApiCompetitionCapability.Curation], "curation"],
  [[ApiCompetitionCapability.Quorum], "quorum"],
] as const)(
  "uses explicit capabilities %s without inheriting the parent wave designation",
  (capabilities, expected) => {
    mockSettings({ memes: "shared-wave" });
    const { result } = renderHook(() =>
      useWaveParticipationVariant("shared-wave", capabilities)
    );
    expect(result.current).toBe(expected);
  }
);
