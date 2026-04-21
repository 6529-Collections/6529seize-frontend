import { resolveWaveParticipationVariant } from "@/helpers/waves/wave-participation-presentation.helpers";

describe("resolveWaveParticipationVariant", () => {
  it("returns default when wave id is missing", () => {
    expect(
      resolveWaveParticipationVariant({
        waveId: null,
        isMemesWave: () => false,
        isQuorumWave: () => false,
      })
    ).toBe("default");
  });

  it("returns memes for memes waves", () => {
    expect(
      resolveWaveParticipationVariant({
        waveId: "meme-wave",
        isMemesWave: (waveId) => waveId === "meme-wave",
        isQuorumWave: () => false,
      })
    ).toBe("memes");
  });

  it("returns quorum for quorum waves", () => {
    expect(
      resolveWaveParticipationVariant({
        waveId: "quorum-wave",
        isMemesWave: () => false,
        isQuorumWave: (waveId) => waveId === "quorum-wave",
      })
    ).toBe("quorum");
  });

  it("prefers explicit overrides over built-in variants", () => {
    expect(
      resolveWaveParticipationVariant({
        waveId: "meme-wave",
        overrides: { "meme-wave": "quorum" },
        isMemesWave: (waveId) => waveId === "meme-wave",
        isQuorumWave: () => false,
      })
    ).toBe("quorum");
  });
});
