import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";

describe("resolveWaveSubmissionExperience", () => {
  it("prefers memes legacy behavior over submission strategy", () => {
    expect(
      resolveWaveSubmissionExperience({
        isMemesWave: true,
        isCurationWave: false,
        submissionStrategy: {
          type: "IDENTITY" as any,
          config: {
            who_can_be_submitted: "EVERYONE" as any,
            duplicates: "NEVER_ALLOW" as any,
          },
        },
      })
    ).toBe(WaveSubmissionExperience.MEMES_LEGACY);
  });

  it("prefers curation legacy behavior over submission strategy", () => {
    expect(
      resolveWaveSubmissionExperience({
        isMemesWave: false,
        isCurationWave: true,
        submissionStrategy: {
          type: "IDENTITY" as any,
          config: {
            who_can_be_submitted: "EVERYONE" as any,
            duplicates: "NEVER_ALLOW" as any,
          },
        },
      })
    ).toBe(WaveSubmissionExperience.CURATION_LEGACY);
  });

  it("uses identity experience for non-legacy waves with submission strategy", () => {
    expect(
      resolveWaveSubmissionExperience({
        isMemesWave: false,
        isCurationWave: false,
        submissionStrategy: {
          type: "IDENTITY" as any,
          config: {
            who_can_be_submitted: "EVERYONE" as any,
            duplicates: "NEVER_ALLOW" as any,
          },
        },
      })
    ).toBe(WaveSubmissionExperience.IDENTITY);
  });

  it("falls back to default when no special behavior applies", () => {
    expect(
      resolveWaveSubmissionExperience({
        isMemesWave: false,
        isCurationWave: false,
        submissionStrategy: null,
      })
    ).toBe(WaveSubmissionExperience.DEFAULT);
  });
});
