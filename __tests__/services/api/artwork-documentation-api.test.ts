import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { documentationProfileKey } from "@/services/api/artwork-documentation-api";

describe("documentation profile selection", () => {
  it("keeps profiles for distinct Waves independently selectable", () => {
    const profile = documentationFixture().profile;
    const firstWave = { ...profile, wave_id: "wave-one" };
    const secondWave = { ...profile, wave_id: "wave-two" };

    expect(documentationProfileKey(firstWave)).not.toBe(
      documentationProfileKey(secondWave)
    );
    expect(documentationProfileKey(firstWave)).not.toBe(
      documentationProfileKey(profile)
    );
    expect(documentationProfileKey({ ...firstWave })).toBe(
      documentationProfileKey(firstWave)
    );
  });

  it("keeps profile, program, and version distinctions within the same Wave", () => {
    const profile = { ...documentationFixture().profile, wave_id: "wave" };
    const variants = [
      profile,
      { ...profile, profile_id: "other-profile" },
      { ...profile, program_id: "other-program" },
      { ...profile, version: profile.version + 1 },
    ];

    expect(new Set(variants.map(documentationProfileKey)).size).toBe(
      variants.length
    );
  });
});
