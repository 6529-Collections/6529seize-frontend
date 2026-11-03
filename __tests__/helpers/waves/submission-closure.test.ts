import { ApiWave } from "@/generated/models/ApiWave";
import { ApiCompetition } from "@/generated/models/ApiCompetition";
import { getWaveSubmissionClosure } from "@/helpers/waves/submission-closure";

function waveWithCompetition(overrides: Partial<ApiCompetition> = {}) {
  return Object.assign(new ApiWave(), {
    id: "wave",
    participation: { period: { max: 100 } },
    competition: Object.assign(new ApiCompetition(), {
      wave_id: "wave",
      participation: { ends_at: null },
      ...overrides,
    }),
  });
}

describe("submission closure", () => {
  it("uses the selected competition rather than an expired legacy period", () => {
    expect(getWaveSubmissionClosure(waveWithCompetition(), 200)).toBeNull();
  });

  it("recognizes an elapsed submission period while voting remains open", () => {
    const wave = waveWithCompetition();
    wave.competition.participation.ends_at = 150;
    expect(getWaveSubmissionClosure(wave, 200)).toEqual({ closedAt: 150 });
  });

  it("uses an earlier manual end instead of the future scheduled end", () => {
    const wave = waveWithCompetition({ ended_at: 140 });
    wave.competition.participation.ends_at = 300;
    expect(getWaveSubmissionClosure(wave, 200)).toEqual({ closedAt: 140 });
  });

  it("keeps the earlier submission deadline when the competition ends later", () => {
    const wave = waveWithCompetition({ ended_at: 180 });
    wave.competition.participation.ends_at = 150;
    expect(getWaveSubmissionClosure(wave, 200)).toEqual({ closedAt: 150 });
  });

  it.each([{ lifecycle: "ENDED" }, { computed_phase: "COMPLETED" }])(
    "does not invent a closing date for a completed competition: %j",
    (state) => {
      const wave = waveWithCompetition();
      Object.assign(wave.competition, state);
      expect(getWaveSubmissionClosure(wave, 200)).toEqual({ closedAt: null });
    }
  );

  it("preserves a legacy wave's elapsed period", () => {
    const wave = Object.assign(new ApiWave(), {
      participation: { period: { max: 150 } },
    });
    expect(getWaveSubmissionClosure(wave, 200)).toEqual({ closedAt: 150 });
  });
});
