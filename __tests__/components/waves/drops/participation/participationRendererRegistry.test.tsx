import { render, renderHook } from "@testing-library/react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import MemeParticipationDrop from "@/components/memes/drops/MemeParticipationDrop";
import QuorumParticipationDrop from "@/components/waves/quorum/QuorumParticipationDrop";
import DefaultParticipationDrop from "@/components/waves/drops/participation/DefaultParticipationDrop";
import { useWaveParticipationRendererSet } from "@/components/waves/drops/participation/participationRendererRegistry";
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";
import type { ComponentProps } from "react";

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

jest.mock("@/components/memes/drops/MemeParticipationDrop", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/waves/quorum/QuorumParticipationDrop", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseSeizeSettings = useSeizeSettings as jest.MockedFunction<
  typeof useSeizeSettings
>;
const mockUseWaveProposalCardPresentation =
  useWaveProposalCardPresentation as jest.MockedFunction<
    typeof useWaveProposalCardPresentation
  >;

const createSeizeSettingsContext = (
  overrides: Partial<ReturnType<typeof useSeizeSettings>> = {}
): ReturnType<typeof useSeizeSettings> => ({
  seizeSettings: {
    rememes_submission_tdh_threshold: 0,
    memes_wave_id: null,
    curation_wave_id: null,
    quorum_wave_id: null,
    announcements_wave_id: null,
    distribution_admin_wallets: [],
    claims_admin_wallets: [],
    auth: {
      structured_signatures_required: false,
      session_v2_migration_deadline: null,
    },
    consolidation: null,
  },
  isMemesWave: () => false,
  isCurationWave: () => false,
  isQuorumWave: () => false,
  isAnnouncementsWave: () => false,
  isMemesSubmission: () => false,
  isLoaded: true,
  loadError: null,
  loadSeizeSettings: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("useWaveParticipationRendererSet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSeizeSettings.mockReturnValue(createSeizeSettingsContext());
    mockUseWaveProposalCardPresentation.mockReturnValue("default");
  });

  it("returns the explicit curation variant with the default list renderer", () => {
    mockUseSeizeSettings.mockReturnValue(
      createSeizeSettingsContext({
        isCurationWave: (waveId) => waveId === "curation-wave",
      })
    );

    const { result } = renderHook(() =>
      useWaveParticipationRendererSet("curation-wave")
    );

    expect(result.current.variant).toBe("curation");
    expect(result.current.ParticipationDrop).toBe(DefaultParticipationDrop);
  });

  it("uses compact cards for proposal lists", () => {
    mockUseWaveProposalCardPresentation.mockReturnValue("proposalCard");

    const { result } = renderHook(() =>
      useWaveParticipationRendererSet("network-museum")
    );
    const ParticipationDrop = result.current.ParticipationDrop;

    render(
      <ParticipationDrop
        {...({ drop: {} } as ComponentProps<typeof DefaultParticipationDrop>)}
      />
    );

    expect(DefaultParticipationDrop).toHaveBeenCalledWith(
      expect.objectContaining({ contentPresentation: "proposalCard" }),
      undefined
    );
  });

  it("resolves the memes and quorum list renderers", () => {
    mockUseSeizeSettings.mockReturnValue(
      createSeizeSettingsContext({
        isMemesWave: (waveId) => waveId === "memes-wave",
        isQuorumWave: (waveId) => waveId === "quorum-wave",
      })
    );

    const memes = renderHook(() =>
      useWaveParticipationRendererSet("memes-wave")
    );
    const quorum = renderHook(() =>
      useWaveParticipationRendererSet("quorum-wave")
    );

    expect(memes.result.current.variant).toBe("memes");
    expect(memes.result.current.ParticipationDrop).toBe(MemeParticipationDrop);
    expect(quorum.result.current.variant).toBe("quorum");
    expect(quorum.result.current.ParticipationDrop).toBe(
      QuorumParticipationDrop
    );
  });
});
